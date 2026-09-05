import hashlib
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import text, select, func
from sqlalchemy.exc import IntegrityError
from app.models import (
    AuditException,
    WorkRecommended,
    WorkSanctioned,
    WorkCompleted,
    Expenditure,
    AllocatedLimit
)

class AuditEngine:
    def __init__(self, db: Session):
        self.db = db

    def _generate_fingerprint(self, exception_type: str, work_id_or_entity: str, current_date: str) -> str:
        s = f"{exception_type}_{work_id_or_entity}_{current_date}"
        return hashlib.md5(s.encode()).hexdigest()

    def _save_exception(self, **kwargs):
        exception = AuditException(**kwargs)
        self.db.add(exception)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()

    def generate_exceptions(self):
        current_date = date.today().isoformat()
        
        # Helper to extract work_id and dates safely
        def get_field(raw, field):
            if not raw: return None
            return raw.get(field)
            
        # 1. DATA QUALITY: Missing mp_name or state_name in AllocatedLimit
        allocated = self.db.execute(select(AllocatedLimit.id, AllocatedLimit.mp_name, AllocatedLimit.state_name)).fetchall()
        for row in allocated:
            if not row.mp_name or not row.state_name:
                self._save_exception(
                    fingerprint=self._generate_fingerprint('MISSING_CRITICAL_FIELD', f"alloc_{row.id}", current_date),
                    entity_type='MP' if not row.mp_name else 'STATE',
                    entity_name=row.mp_name or row.state_name,
                    state_name=row.state_name,
                    exception_category='DATA_QUALITY',
                    exception_type='MISSING_CRITICAL_FIELD',
                    severity='MEDIUM',
                    explanation="Missing mp_name or state_name in AllocatedLimit"
                )

        # Pre-fetch for relational checks
        recommended = self.db.execute(select(WorkRecommended.id, WorkRecommended.raw_data, WorkRecommended.recommended_amount)).fetchall()
        sanctioned = self.db.execute(select(WorkSanctioned.id, WorkSanctioned.raw_data, WorkSanctioned.sanction_amount, WorkSanctioned.state_name, WorkSanctioned.constituency)).fetchall()
        completed = self.db.execute(select(WorkCompleted.id, WorkCompleted.work_id, WorkCompleted.raw_data, WorkCompleted.state_name, WorkCompleted.constituency)).fetchall()
        expenditures = self.db.execute(select(Expenditure.id, Expenditure.work_id, Expenditure.fund_disbursed_amt, Expenditure.state_name, Expenditure.constituency)).fetchall()

        # Build dicts for quick lookup
        # Assume work_id is in raw_data for sanctioned/recommended if not a direct column, or they link by work_name
        sanc_by_work = {}
        for s in sanctioned:
            wid = get_field(s.raw_data, 'work_id') or get_field(s.raw_data, 'work_name') or str(s.id)
            sanc_by_work[wid] = s

        rec_by_work = {}
        for r in recommended:
            wid = get_field(r.raw_data, 'work_id') or get_field(r.raw_data, 'work_name') or str(r.id)
            rec_by_work[wid] = r

        # 2. FINANCIAL: sanction_amount > recommended_amount
        for wid, sanc in sanc_by_work.items():
            rec = rec_by_work.get(wid)
            s_amt = sanc.sanction_amount or 0
            if rec:
                r_amt = rec.recommended_amount or 0
                if s_amt > r_amt:
                    self._save_exception(
                        fingerprint=self._generate_fingerprint('EXCESS_SANCTION', wid, current_date),
                        work_id=wid,
                        entity_type='WORK',
                        state_name=sanc.state_name,
                        constituency=sanc.constituency,
                        exception_category='FINANCIAL',
                        exception_type='EXCESS_SANCTION',
                        severity='HIGH',
                        explanation=f"Sanction amount ({s_amt}) > Recommended amount ({r_amt})"
                    )

        # 3. FINANCIAL: Negative Financials
        for s in sanctioned:
            if s.sanction_amount is not None and s.sanction_amount < 0:
                wid = get_field(s.raw_data, 'work_id') or str(s.id)
                self._save_exception(
                    fingerprint=self._generate_fingerprint('NEGATIVE_FINANCIALS', f"sanc_{s.id}", current_date),
                    work_id=wid,
                    entity_type='WORK',
                    state_name=s.state_name,
                    constituency=s.constituency,
                    exception_category='FINANCIAL',
                    exception_type='NEGATIVE_FINANCIALS',
                    severity='HIGH',
                    explanation="Negative sanction amount"
                )

        for e in expenditures:
            if e.fund_disbursed_amt is not None and e.fund_disbursed_amt < 0:
                wid = e.work_id or str(e.id)
                self._save_exception(
                    fingerprint=self._generate_fingerprint('NEGATIVE_FINANCIALS', f"exp_{e.id}", current_date),
                    work_id=wid,
                    entity_type='WORK',
                    state_name=e.state_name,
                    constituency=e.constituency,
                    exception_category='FINANCIAL',
                    exception_type='NEGATIVE_FINANCIALS',
                    severity='HIGH',
                    explanation="Negative fund disbursed amount"
                )

        # 4. FINANCIAL: fund_disbursed_amt > sanction_amount
        # Group expenditures by work_id
        exp_by_work = {}
        for e in expenditures:
            wid = e.work_id
            if wid:
                if wid not in exp_by_work:
                    exp_by_work[wid] = {'amt': 0, 'state': e.state_name, 'const': e.constituency}
                if e.fund_disbursed_amt:
                    exp_by_work[wid]['amt'] += e.fund_disbursed_amt
        
        for wid, exp_data in exp_by_work.items():
            sanc = sanc_by_work.get(wid)
            if sanc:
                s_amt = sanc.sanction_amount or 0
                if exp_data['amt'] > s_amt:
                    self._save_exception(
                        fingerprint=self._generate_fingerprint('EXCESS_EXPENDITURE', wid, current_date),
                        work_id=wid,
                        entity_type='WORK',
                        state_name=exp_data['state'],
                        constituency=exp_data['const'],
                        exception_category='FINANCIAL',
                        exception_type='EXCESS_EXPENDITURE',
                        severity='HIGH',
                        explanation=f"Disbursed ({exp_data['amt']}) > Sanctioned ({s_amt})"
                    )

        # 5. WORKFLOW: COMPLETED_WITHOUT_SANCTION & INVALID_DATE_SEQUENCE
        for c in completed:
            wid = c.work_id or get_field(c.raw_data, 'work_name') or str(c.id)
            sanc = sanc_by_work.get(wid)
            
            if not sanc:
                self._save_exception(
                    fingerprint=self._generate_fingerprint('COMPLETED_WITHOUT_SANCTION', wid, current_date),
                    work_id=wid,
                    entity_type='WORK',
                    state_name=c.state_name,
                    constituency=c.constituency,
                    exception_category='WORKFLOW',
                    exception_type='COMPLETED_WITHOUT_SANCTION',
                    severity='HIGH',
                    explanation="Work marked as completed but not found in sanctioned records"
                )
            else:
                # INVALID_DATE_SEQUENCE: date_of_completion < date_of_sanction
                doc_str = get_field(c.raw_data, 'date_of_completion')
                dos_str = get_field(sanc.raw_data, 'date_of_sanction')
                if doc_str and dos_str:
                    try:
                        doc = datetime.fromisoformat(doc_str.replace('Z', '+00:00')).date() if 'T' in doc_str else datetime.strptime(doc_str, "%Y-%m-%d").date()
                        dos = datetime.fromisoformat(dos_str.replace('Z', '+00:00')).date() if 'T' in dos_str else datetime.strptime(dos_str, "%Y-%m-%d").date()
                        
                        if doc < dos:
                            self._save_exception(
                                fingerprint=self._generate_fingerprint('INVALID_DATE_SEQUENCE', wid, current_date),
                                work_id=wid,
                                entity_type='WORK',
                                state_name=c.state_name,
                                constituency=c.constituency,
                                exception_category='WORKFLOW',
                                exception_type='INVALID_DATE_SEQUENCE',
                                severity='MEDIUM',
                                explanation=f"Completion date ({doc}) is earlier than sanction date ({dos})"
                            )
                    except (ValueError, TypeError):
                        pass


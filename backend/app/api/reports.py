from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, select, desc
from typing import Optional
from app.database import get_db
from app.models import ReportHistory, AllocatedLimit, WorkRecommended, WorkSanctioned, WorkCompleted, Expenditure, Alert, AuditException
import io
import csv
import json
import datetime

router = APIRouter()

def clean_val(v):
    if v is None: return 0
    return v

@router.get("/national")
def get_national_report(db: Session = Depends(get_db)):
    allocated = db.query(func.sum(AllocatedLimit.allocated_amt)).scalar() or 0
    recommended = db.query(func.sum(WorkRecommended.recommended_amount)).scalar() or 0
    sanctioned = db.query(func.sum(WorkSanctioned.sanction_amount)).scalar() or 0
    expenditure = db.query(func.sum(Expenditure.fund_disbursed_amt)).scalar() or 0
    completed = db.query(func.count(WorkCompleted.id)).scalar() or 0
    ongoing = db.query(func.count(WorkSanctioned.id)).scalar() or 0
    ongoing = max(0, ongoing - completed)
    utilization = (expenditure / sanctioned * 100) if sanctioned > 0 else 0

    high_risk_mps = db.query(Alert).filter(Alert.priority == 'HIGH').order_by(desc(Alert.detected_at)).limit(10).all()
    exceptions = db.query(AuditException).filter(AuditException.severity == 'HIGH').order_by(desc(AuditException.detected_at)).limit(10).all()

    return {
        "overview": {
            "total_allocated": allocated,
            "total_recommended": recommended,
            "total_sanctioned": sanctioned,
            "total_expenditure": expenditure,
            "completed_works": completed,
            "ongoing_works": ongoing,
            "utilization": utilization
        },
        "high_risk_mps": high_risk_mps,
        "exceptions": exceptions
    }

@router.get("/state/{state}")
def get_state_report(state: str, db: Session = Depends(get_db)):
    allocated = db.query(func.sum(AllocatedLimit.allocated_amount)).filter(AllocatedLimit.state_name == state).scalar() or 0
    recommended = db.query(func.sum(WorkRecommended.recommended_amount)).filter(WorkRecommended.state_name == state).scalar() or 0
    sanctioned = db.query(func.sum(WorkSanctioned.sanction_amount)).filter(WorkSanctioned.state_name == state).scalar() or 0
    expenditure = db.query(func.sum(Expenditure.fund_disbursed_amt)).filter(Expenditure.state_name == state).scalar() or 0
    completed = db.query(func.count(WorkCompleted.id)).filter(WorkCompleted.state_name == state).scalar() or 0
    ongoing = db.query(func.count(WorkSanctioned.id)).filter(WorkSanctioned.state_name == state).scalar() or 0
    ongoing = max(0, ongoing - completed)
    utilization = (expenditure / sanctioned * 100) if sanctioned > 0 else 0

    mps = db.query(AllocatedLimit.mp_name, AllocatedLimit.constituency).filter(AllocatedLimit.state_name == state).distinct().all()

    return {
        "overview": {
            "state": state,
            "total_allocated": allocated,
            "total_recommended": recommended,
            "total_sanctioned": sanctioned,
            "total_expenditure": expenditure,
            "completed_works": completed,
            "ongoing_works": ongoing,
            "utilization": utilization,
            "total_mps": len(mps)
        },
        "mps": [{"mp_name": r[0], "constituency": r[1]} for r in mps]
    }

@router.get("/decision-support")
def get_decision_support(db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.priority.in_(['HIGH', 'MEDIUM'])).filter(Alert.status == 'OPEN').order_by(desc(Alert.detected_at)).limit(50).all()
    exceptions = db.query(AuditException).filter(AuditException.severity == 'HIGH').filter(AuditException.status == 'OPEN').order_by(desc(AuditException.detected_at)).limit(50).all()
    
    queue = []
    for a in alerts:
        queue.append({
            "id": f"alert_{a.id}",
            "entity_type": a.entity_type,
            "entity_name": a.entity_name,
            "reason": a.description,
            "priority": a.priority,
            "status": a.status,
            "source": "AI_ANOMALY",
            "date": str(a.detected_at)
        })
    for e in exceptions:
        queue.append({
            "id": f"exc_{e.id}",
            "entity_type": e.entity_type,
            "entity_name": e.entity_name or e.work_id,
            "reason": e.explanation,
            "priority": e.severity,
            "status": e.status,
            "source": "AUDIT",
            "date": str(e.detected_at)
        })
        
    queue.sort(key=lambda x: x["date"], reverse=True)
    return queue[:20]

@router.get("/export")
def export_csv(report_type: str, state: Optional[str] = None, db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == 'NATIONAL':
        writer.writerow(["State", "Total MPs", "Allocated", "Sanctioned", "Expenditure"])
        states = db.query(AllocatedLimit.state_name).distinct().all()
        for row in states:
            s = row[0]
            if not s: continue
            alloc = db.query(func.sum(AllocatedLimit.allocated_amt)).filter(AllocatedLimit.state_name == s).scalar() or 0
            sanc = db.query(func.sum(WorkSanctioned.sanction_amount)).filter(WorkSanctioned.state_name == s).scalar() or 0
            exp = db.query(func.sum(Expenditure.fund_disbursed_amt)).filter(Expenditure.state_name == s).scalar() or 0
            mps = db.query(func.count(AllocatedLimit.id)).filter(AllocatedLimit.state_name == s).scalar() or 0
            writer.writerow([s, mps, alloc, sanc, exp])
    elif report_type == 'STATE' and state:
        writer.writerow(["MP Name", "Constituency", "Allocated"])
        mps = db.query(AllocatedLimit).filter(AllocatedLimit.state_name == state).all()
        for mp in mps:
            writer.writerow([mp.mp_name, mp.constituency, mp.allocated_amt])
    else:
        writer.writerow(["Error", "Invalid report type"])

    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=mplads_{report_type.lower()}_report.csv"})

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    return db.query(ReportHistory).order_by(desc(ReportHistory.generated_at)).limit(20).all()

@router.post("/history")
def create_history(payload: dict, db: Session = Depends(get_db)):
    h = ReportHistory(
        report_type=payload.get("report_type"),
        filters=json.dumps(payload.get("filters", {}))
    )
    db.add(h)
    db.commit()
    return {"status": "success"}

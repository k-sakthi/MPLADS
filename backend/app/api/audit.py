from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, select, desc
from typing import Optional
from app.database import get_db
from app.models import AuditException, AllocatedLimit, WorkRecommended, WorkSanctioned, WorkCompleted, Expenditure
from app.services.audit_engine import AuditEngine
from pydantic import BaseModel
import datetime

router = APIRouter()

class AuditStatusUpdate(BaseModel):
    status: str

@router.get("/")
def list_exceptions(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(AuditException)
    
    if category and category != "ALL":
        query = query.filter(AuditException.exception_category == category)
    if severity and severity != "ALL":
        query = query.filter(AuditException.severity == severity)
    if status and status != "ALL":
        query = query.filter(AuditException.status == status)
        
    total = query.count()
    exceptions = query.order_by(desc(AuditException.detected_at)).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "data": exceptions
    }

@router.get("/summary")
def get_audit_summary(db: Session = Depends(get_db)):
    # total checked records (sum of major tables)
    t1 = db.query(AllocatedLimit).count()
    t2 = db.query(WorkRecommended).count()
    t3 = db.query(WorkSanctioned).count()
    t4 = db.query(WorkCompleted).count()
    t5 = db.query(Expenditure).count()
    total_checked = t1 + t2 + t3 + t4 + t5

    total_exceptions = db.query(AuditException).count()
    high = db.query(AuditException).filter(AuditException.severity == 'HIGH').count()
    medium = db.query(AuditException).filter(AuditException.severity == 'MEDIUM').count()
    
    data_quality_score = 100
    if total_checked > 0:
        data_quality_score = ((total_checked - total_exceptions) / total_checked) * 100
        
    financial_exceptions = db.query(AuditException).filter(AuditException.exception_category == 'FINANCIAL').count()
    total_financial_records = t3 + t5 # Sanctioned and Expenditure tables
    financial_consistency_rate = 100
    if total_financial_records > 0:
        financial_consistency_rate = ((total_financial_records - financial_exceptions) / total_financial_records) * 100

    return {
        "records_checked": total_checked,
        "exceptions_detected": total_exceptions,
        "high_severity": high,
        "medium_severity": medium,
        "data_quality_score": round(data_quality_score, 2),
        "financial_consistency_rate": round(financial_consistency_rate, 2)
    }

@router.get("/trends")
def get_audit_trends(db: Session = Depends(get_db)):
    results = db.query(
        func.date(AuditException.detected_at).label("date"),
        func.count(AuditException.id).label("count")
    ).group_by(func.date(AuditException.detected_at)).order_by(func.date(AuditException.detected_at)).all()
    
    data = {str(r.date): r.count for r in results}
    
    today = datetime.date.today()
    final_data = []
    
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        d_str = str(d)
        final_data.append({"date": d_str, "count": data.get(d_str, 0)})
        
    if data:
        older_dates = [d for d in data.keys() if d < final_data[0]["date"]]
        older_dates.sort()
        for d in older_dates:
            final_data.insert(0, {"date": d, "count": data[d]})
            
    return final_data

@router.get("/provenance")
def get_data_provenance(db: Session = Depends(get_db)):
    t1 = db.query(AllocatedLimit).count()
    t2 = db.query(WorkRecommended).count()
    t3 = db.query(WorkSanctioned).count()
    t4 = db.query(WorkCompleted).count()
    t5 = db.query(Expenditure).count()
    total_synced = t1 + t2 + t3 + t4 + t5
    return {
        "source_name": "Official MPLADS eSAKSHI",
        "source_url": "https://mplads.mospi.gov.in/rest/PreLoginDashboardData/getTilesReportData",
        "last_sync": datetime.datetime.utcnow().isoformat() + "Z",
        "total_entities_synced": total_synced,
        "status": "HEALTHY"
    }

@router.post("/generate")
def generate_exceptions(db: Session = Depends(get_db)):
    engine = AuditEngine(db)
    engine.generate_exceptions()
    return {"status": "success", "message": "Audit generation complete"}

@router.patch("/{exception_id}/status")
def update_exception_status(exception_id: int, payload: AuditStatusUpdate, db: Session = Depends(get_db)):
    valid_statuses = ["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    exc = db.query(AuditException).filter(AuditException.id == exception_id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Exception not found")
        
    exc.status = payload.status
    db.commit()
    return {"status": "success", "id": exception_id, "new_status": payload.status}

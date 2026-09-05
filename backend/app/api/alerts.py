from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, select, desc
from typing import Optional
from app.database import get_db
from app.models import Alert
from app.services.alert_engine import AlertEngine
from pydantic import BaseModel
import datetime

router = APIRouter()

class AlertStatusUpdate(BaseModel):
    status: str

@router.get("/")
def list_alerts(
    priority: Optional[str] = None,
    status: Optional[str] = None,
    alert_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    
    if priority and priority != "ALL":
        query = query.filter(Alert.priority == priority)
    if status and status != "ALL":
        query = query.filter(Alert.status == status)
    if alert_type and alert_type != "ALL":
        query = query.filter(Alert.alert_type == alert_type)
        
    total = query.count()
    alerts = query.order_by(desc(Alert.detected_at)).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "data": alerts
    }

@router.get("/summary")
def get_alerts_summary(db: Session = Depends(get_db)):
    total = db.query(Alert).count()
    high = db.query(Alert).filter(Alert.priority == 'HIGH').count()
    medium = db.query(Alert).filter(Alert.priority == 'MEDIUM').count()
    open_count = db.query(Alert).filter(Alert.status == 'OPEN').count()
    review = db.query(Alert).filter(Alert.status == 'UNDER_REVIEW').count()
    resolved = db.query(Alert).filter(Alert.status == 'RESOLVED').count()
    
    return {
        "total": total,
        "high_priority": high,
        "medium_priority": medium,
        "open": open_count,
        "under_review": review,
        "resolved": resolved
    }

@router.get("/trends")
def get_alerts_trends(db: Session = Depends(get_db)):
    # Group by date of detected_at
    results = db.query(
        func.date(Alert.detected_at).label("date"),
        func.count(Alert.id).label("count")
    ).group_by(func.date(Alert.detected_at)).order_by(func.date(Alert.detected_at)).all()
    
    data = {str(r.date): r.count for r in results}
    
    # Ensure at least 7 days of data for the chart to render properly
    today = datetime.date.today()
    final_data = []
    
    # Pad 6 days back from today
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        d_str = str(d)
        final_data.append({"date": d_str, "count": data.get(d_str, 0)})
        
    # Prepend any older dates not in the window
    if data:
        older_dates = [d for d in data.keys() if d < final_data[0]["date"]]
        older_dates.sort()
        for d in older_dates:
            final_data.insert(0, {"date": d, "count": data[d]})
            
    return final_data

@router.get("/categories")
def get_alerts_categories(db: Session = Depends(get_db)):
    results = db.query(
        Alert.alert_type,
        func.count(Alert.id).label("count")
    ).group_by(Alert.alert_type).all()
    
    return [{"category": r.alert_type, "count": r.count} for r in results]

@router.post("/generate")
def generate_alerts(db: Session = Depends(get_db)):
    engine = AlertEngine(db)
    result = engine.generate_alerts()
    return result

@router.patch("/{alert_id}/status")
def update_alert_status(alert_id: int, payload: AlertStatusUpdate, db: Session = Depends(get_db)):
    valid_statuses = ["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = payload.status
    db.commit()
    return {"status": "success", "alert_id": alert_id, "new_status": payload.status}

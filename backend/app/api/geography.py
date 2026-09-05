from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
import pandas as pd
import json

from app.database import get_db
from app.models import WorkRecommended, WorkSanctioned, WorkCompleted, Expenditure
from app.services.analytics_engine import AnalyticsEngine
from app.services.ml_anomaly import MLAnomalyDetector

router = APIRouter()

@router.get("/summary")
def get_geography_summary(db: Session = Depends(get_db)):
    """
    Returns aggregated KPIs for geographic intelligence.
    """
    total_exp = db.query(func.sum(Expenditure.fund_disbursed_amt)).scalar() or 0
    total_sanc = db.query(func.sum(WorkSanctioned.sanction_amount)).scalar() or 0
    utilization = (total_exp / total_sanc * 100) if total_sanc > 0 else 0
    
    # Calculate risk using ML engine
    engine = AnalyticsEngine(db)
    mp_df = engine.get_mp_metrics()
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)
    high_risk_count = len(mp_df[mp_df['risk_level'] == 'HIGH']) if not mp_df.empty else 0
    
    # Total completed works
    completed_works = db.query(func.count(WorkCompleted.id)).filter(WorkCompleted.actual_amount > 0).scalar() or 0
    
    # State with highest risk concentration
    highest_risk_state = None
    highest_exp_state = "N/A"
    highest_exp_val = 0
    if not mp_df.empty:
        risk_by_state = mp_df.groupby('STATE_NAME')['risk_score'].mean().reset_index()
        highest_risk_state_row = risk_by_state.sort_values(by='risk_score', ascending=False).iloc[0]
        highest_risk_state = highest_risk_state_row['STATE_NAME']
        
        exp_by_state = mp_df.groupby('STATE_NAME')['expenditure_amount'].sum().reset_index()
        highest_exp_row = exp_by_state.sort_values(by='expenditure_amount', ascending=False).iloc[0]
        highest_exp_state = highest_exp_row['STATE_NAME']
        highest_exp_val = highest_exp_row['expenditure_amount']
    
    return {
        "active_states": len(mp_df['STATE_NAME'].unique()) if not mp_df.empty else 0,
        "total_expenditure": float(total_exp),
        "overall_utilization": float(utilization),
        "highest_expenditure_state": highest_exp_state,
        "highest_expenditure_value": float(highest_exp_val),
        "most_completed_works": int(completed_works),
        "high_risk_mps": high_risk_count,
        "highest_risk_state": str(highest_risk_state) if highest_risk_state else "N/A"
    }

@router.get("/states")
def get_geography_states(db: Session = Depends(get_db)):
    """
    Returns MPLADS metrics aggregated by state.
    Uses the heavily optimized get_mp_metrics cache to avoid joining large tables.
    """
    engine = AnalyticsEngine(db)
    mp_df = engine.get_mp_metrics()
    
    if mp_df.empty:
        return {"data": []}
        
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)
    
    # Aggregate to State Level
    state_df = mp_df.groupby('STATE_NAME').agg(
        allocated_amount=('allocated_amount', 'sum'),
        recommended_amount=('recommended_amount', 'sum'),
        sanctioned_amount=('sanctioned_amount', 'sum'),
        expenditure_amount=('expenditure_amount', 'sum'),
        completed_count=('completed_count', 'sum'),
        ongoing_count=('ongoing_count', 'sum'),
        risk_score=('risk_score', 'mean')
    ).reset_index()
    
    # Calculate utilization
    state_df['utilization'] = state_df.apply(
        lambda row: (row['expenditure_amount'] / row['sanctioned_amount'] * 100) if row['sanctioned_amount'] > 0 else 0, axis=1
    )
    
    # Assign risk level based on average risk score
    state_df['risk_level'] = pd.cut(
        state_df['risk_score'],
        bins=[-1, 50, 75, 100],
        labels=['LOW', 'MEDIUM', 'HIGH']
    )
    
    # Map highcharts topological name if needed, we keep state name clean
    state_df['STATE_NAME'] = state_df['STATE_NAME'].str.title()
    
    import math
    def clean_rec(rec):
        for k, v in rec.items():
            if isinstance(v, float) and math.isnan(v):
                rec[k] = None
        return rec

    records = [clean_rec(r) for r in state_df.to_dict(orient='records')]
    return {"data": records}

@router.get("/constituencies")
def get_geography_constituencies(
    state: str = Query(..., description="State name to filter by"),
    db: Session = Depends(get_db)
):
    """
    Returns constituencies for a given state.
    """
    engine = AnalyticsEngine(db)
    mp_df = engine.get_mp_metrics()
    
    if mp_df.empty:
        return {"data": []}
        
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)
    
    # Filter by state (case insensitive)
    filtered_df = mp_df[mp_df['STATE_NAME'].str.lower() == state.lower()].copy()
    
    if filtered_df.empty:
        return {"data": []}
        
    import math
    def clean_rec(rec):
        for k, v in rec.items():
            if isinstance(v, float) and math.isnan(v):
                rec[k] = None
        return rec

    records = [clean_rec(r) for r in filtered_df.to_dict(orient='records')]
    return {"data": records}

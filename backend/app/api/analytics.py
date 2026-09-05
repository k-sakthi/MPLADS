from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Any
from app.database import get_db
from app.services.analytics_engine import AnalyticsEngine
from app.services.ml_anomaly import MLAnomalyDetector
import json
import math
import pandas as pd

router = APIRouter()

@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns high-level SQL aggregated metrics for the dashboard instantly.
    """
    engine = AnalyticsEngine(db)
    return engine.get_dashboard_summary()

@router.get("/mps")
def get_mp_analytics(
    db: Session = Depends(get_db),
    state: Optional[str] = None,
    constituency: Optional[str] = None,
    house: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    sort_by: str = "allocated_amount",
    sort_desc: bool = True
):
    engine = AnalyticsEngine(db)
    df = engine.get_mp_metrics()
    
    if df.empty:
        return {"data": [], "total": 0, "page": page, "limit": limit}
        
    # Apply ML model to get risk scores
    ml = MLAnomalyDetector()
    df = ml.detect_anomalies(df)

    # Filtering
    if state:
        df = df[df['STATE_NAME'].str.contains(state, case=False, na=False)]
    if constituency:
        df = df[df['CONSTITUENCY'].str.contains(constituency, case=False, na=False)]
    if house and house.lower() != 'all':
        df = df[df['HOUSE_OF_PARLIAMENT'].str.contains(house, case=False, na=False)]
    if search:
        mask = (
            df['MP_NAME'].str.contains(search, case=False, na=False) |
            df['CONSTITUENCY'].str.contains(search, case=False, na=False) |
            df['STATE_NAME'].str.contains(search, case=False, na=False)
        )
        df = df[mask]

    # Sorting
    if sort_by in df.columns:
        df = df.sort_values(by=sort_by, ascending=not sort_desc)

    total_records = len(df)
    
    # Pagination
    start = (page - 1) * limit
    end = start + limit
    df_page = df.iloc[start:end]

    # Convert to list of dicts
    records = df_page.to_dict(orient="records")
    
    # Deserialize top_reasons string into list
    for r in records:
        if 'top_reasons' in r and isinstance(r['top_reasons'], str):
            try:
                r['top_reasons'] = json.loads(r['top_reasons'])
            except:
                r['top_reasons'] = []

    return {
        "data": records,
        "total": total_records,
        "page": page,
        "limit": limit
    }

@router.get("/anomalies")
def get_top_anomalies(
    db: Session = Depends(get_db),
    limit: int = 10
):
    """
    Returns only the top HIGH/MEDIUM risk MPs for dashboard widgets.
    """
    engine = AnalyticsEngine(db)
    df = engine.get_mp_metrics()
    
    if df.empty:
        return {"data": []}
        
    ml = MLAnomalyDetector()
    df = ml.detect_anomalies(df)
    
    # Filter only anomalies
    anomalies = df[df['risk_level'].isin(['HIGH', 'MEDIUM'])].copy()
    anomalies = anomalies.sort_values(by='risk_score', ascending=False).head(limit)
    
    records = anomalies.to_dict(orient="records")
    for r in records:
        if 'top_reasons' in r and isinstance(r['top_reasons'], str):
            try:
                r['top_reasons'] = json.loads(r['top_reasons'])
            except:
                r['top_reasons'] = []
                
    return {"data": records}

@router.get("/mps/{mp_name}")
def get_single_mp_details(
    mp_name: str,
    db: Session = Depends(get_db)
):
    """
    Returns aggregated stats, AI risk, and raw works portfolio for a specific MP.
    """
    import urllib.parse
    mp_name_decoded = urllib.parse.unquote(mp_name)

    engine = AnalyticsEngine(db)
    df = engine.get_mp_metrics()
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No MP data available")
        
    ml = MLAnomalyDetector()
    df = ml.detect_anomalies(df)
    
    # Filter for the exact MP Name
    mp_df = df[df['MP_NAME'].str.lower() == mp_name_decoded.lower()]
    
    if mp_df.empty:
        raise HTTPException(status_code=404, detail="MP not found")
        
    mp_data = mp_df.iloc[0].to_dict()
    
    # Deserialize top_reasons string into list
    if 'top_reasons' in mp_data and isinstance(mp_data['top_reasons'], str):
        try:
            mp_data['top_reasons'] = json.loads(mp_data['top_reasons'])
        except:
            mp_data['top_reasons'] = []

    # Fetch Portfolio from Raw Models
    from app.models import WorkRecommended, WorkSanctioned, WorkCompleted, Expenditure
    
    recommended = db.query(WorkRecommended).filter(func.lower(WorkRecommended.mp_name) == mp_name_decoded.lower()).all()
    sanctioned = db.query(WorkSanctioned).filter(func.lower(WorkSanctioned.mp_name) == mp_name_decoded.lower()).all()
    completed = db.query(WorkCompleted).filter(func.lower(WorkCompleted.mp_name) == mp_name_decoded.lower()).all()
    expenditure = db.query(Expenditure).filter(func.lower(Expenditure.mp_name) == mp_name_decoded.lower()).all()

    portfolio = {
        "recommended": [r.raw_data for r in recommended] if recommended else [],
        "sanctioned": [s.raw_data for s in sanctioned] if sanctioned else [],
        "completed": [c.raw_data for c in completed] if completed else [],
        "expenditure": [e.raw_data for e in expenditure] if expenditure else []
    }

    return {
        "overview": mp_data,
        "portfolio": portfolio
    }

@router.get("/works/summary")
def get_works_summary(db: Session = Depends(get_db)):
    from app.models import WorkRecommended, WorkCompleted, Expenditure
    from sqlalchemy.sql import func
    
    total = db.query(func.count(WorkRecommended.id)).scalar() or 0
    completed = db.query(func.count(WorkCompleted.id)).filter(WorkCompleted.actual_amount > 0).scalar() or 0
    ongoing = total - completed
    expenditure = db.query(func.sum(Expenditure.fund_disbursed_amt)).scalar() or 0
    
    return {
        "total_works": int(total),
        "completed": int(completed),
        "ongoing": int(ongoing),
        "expenditure": float(expenditure)
    }

@router.get("/works")
def get_works_list(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    state: Optional[str] = None,
    constituency: Optional[str] = None,
    mp: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_desc: bool = True,
    db: Session = Depends(get_db)
):
    engine = AnalyticsEngine(db)
    df = engine.get_works_database()
    
    if df.empty:
        return {"data": [], "total": 0, "page": page, "limit": limit}
        
    # MP Anomaly Join
    mp_df = engine.get_mp_metrics()
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)
    
    # Merge risk scores into works
    if not mp_df.empty:
        risk_map = mp_df[['MP_NAME', 'risk_score', 'risk_level', 'top_reasons']]
        df['join_mp'] = df['MP_NAME'].str.lower()
        risk_map['join_mp'] = risk_map['MP_NAME'].str.lower()
        df = pd.merge(df, risk_map.drop(columns=['MP_NAME']), on='join_mp', how='left')
        df.drop(columns=['join_mp'], inplace=True)
    
    # Fill NAs for risk
    if 'risk_score' not in df.columns:
        df['risk_score'] = 0
        df['risk_level'] = 'LOW'
        df['top_reasons'] = '[]'
    
    df['risk_score'] = df['risk_score'].fillna(0)
    df['risk_level'] = df['risk_level'].fillna('LOW')
    df['top_reasons'] = df['top_reasons'].fillna('[]')

    # Filtering
    if search:
        search_lower = search.lower()
        df = df[
            df['WORK_DESCRIPTION'].str.lower().str.contains(search_lower, na=False) |
            df['MP_NAME'].str.lower().str.contains(search_lower, na=False) |
            df['STATE_NAME'].str.lower().str.contains(search_lower, na=False) |
            df['CONSTITUENCY'].str.lower().str.contains(search_lower, na=False)
        ]
        
    if state:
        df = df[df['STATE_NAME'].str.lower() == state.lower()]
    if constituency:
        df = df[df['CONSTITUENCY'].str.lower() == constituency.lower()]
    if mp:
        df = df[df['MP_NAME'].str.lower() == mp.lower()]
    if category:
        df = df[df['WORK_CATEGORY'].str.lower() == category.lower()]
    if status:
        if status.lower() == 'completed':
            df = df[df['ACTUAL_AMOUNT'] > 0]
        elif status.lower() == 'ongoing':
            df = df[df['ACTUAL_AMOUNT'] == 0]

    # Sorting
    if sort_by and sort_by in df.columns:
        df = df.sort_values(by=sort_by, ascending=not sort_desc)
    else:
        df = df.sort_values(by='RECOMMENDED_AMOUNT', ascending=False)
        
    total = len(df)
    
    # Pagination
    start = (page - 1) * limit
    end = start + limit
    df_page = df.iloc[start:end]
    
    records = df_page.to_dict(orient='records')
    
    for r in records:
        if 'top_reasons' in r and isinstance(r['top_reasons'], str):
            try:
                r['top_reasons'] = json.loads(r['top_reasons'])
            except:
                r['top_reasons'] = []
                
    def clean_record(rec):
        for k, v in rec.items():
            if isinstance(v, float) and math.isnan(v):
                rec[k] = None
        return rec
        
    records = [clean_record(r) for r in records]

    return {
        "data": records,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/works/{work_id}")
def get_work_details(
    work_id: str,
    db: Session = Depends(get_db)
):
    import urllib.parse
    work_id = urllib.parse.unquote(work_id)
    
    engine = AnalyticsEngine(db)
    df = engine.get_works_database()
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No works available")
        
    df['WORK_RECOMMENDATION_DTL_ID_STR'] = df['WORK_RECOMMENDATION_DTL_ID'].astype(str)
    work_df = df[df['WORK_RECOMMENDATION_DTL_ID_STR'] == work_id]
    
    if work_df.empty:
        raise HTTPException(status_code=404, detail="Work not found")
        
    mp_df = engine.get_mp_metrics()
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)
    
    if not mp_df.empty:
        risk_map = mp_df[['MP_NAME', 'risk_score', 'risk_level', 'top_reasons']]
        work_df['join_mp'] = work_df['MP_NAME'].str.lower()
        risk_map['join_mp'] = risk_map['MP_NAME'].str.lower()
        work_df = pd.merge(work_df, risk_map.drop(columns=['MP_NAME']), on='join_mp', how='left')
    
    work_data = work_df.iloc[0].to_dict()
    
    if 'top_reasons' in work_data and isinstance(work_data['top_reasons'], str):
        try:
            work_data['top_reasons'] = json.loads(work_data['top_reasons'])
        except:
            work_data['top_reasons'] = []
            
    for k, v in work_data.items():
        if isinstance(v, float) and math.isnan(v):
            work_data[k] = None
            
    return work_data

@router.get("/expenditure/summary")
def get_expenditure_summary(db: Session = Depends(get_db)):
    from app.models import Expenditure, WorkSanctioned, WorkCompleted
    from sqlalchemy.sql import func
    
    total_exp = db.query(func.sum(Expenditure.fund_disbursed_amt)).scalar() or 0
    total_sanc = db.query(func.sum(WorkSanctioned.sanction_amount)).scalar() or 0
    utilization = (total_exp / total_sanc * 100) if total_sanc > 0 else 0
    
    completed_exp = db.query(func.sum(Expenditure.fund_disbursed_amt))\
        .filter(Expenditure.work_id.in_(db.query(WorkCompleted.work_id).filter(WorkCompleted.actual_amount > 0)))\
        .scalar() or 0
        
    ongoing_exp = total_exp - completed_exp
    
    avg_exp = db.query(func.avg(Expenditure.fund_disbursed_amt)).filter(Expenditure.fund_disbursed_amt > 0).scalar() or 0
    max_exp = db.query(func.max(Expenditure.fund_disbursed_amt)).scalar() or 0

    return {
        "total_expenditure": float(total_exp),
        "total_sanctioned": float(total_sanc),
        "overall_utilization": float(utilization),
        "completed_expenditure": float(completed_exp),
        "ongoing_expenditure": float(ongoing_exp),
        "average_expenditure": float(avg_exp),
        "highest_expenditure": float(max_exp)
    }

@router.get("/expenditure/distribution")
def get_expenditure_distribution(db: Session = Depends(get_db)):
    engine = AnalyticsEngine(db)
    df = engine.get_works_database()
    
    if df.empty:
        return {"states": [], "categories": [], "utilization": []}
        
    # State Distribution
    if 'STATE_NAME' in df.columns and 'FUND_DISBURSED_AMT' in df.columns:
        state_df = df.groupby('STATE_NAME')['FUND_DISBURSED_AMT'].sum().reset_index()
        state_df = state_df.sort_values(by='FUND_DISBURSED_AMT', ascending=False).head(10)
        states_dist = state_df.to_dict(orient='records')
    else:
        states_dist = []
        
    # Category Distribution
    if 'WORK_CATEGORY' in df.columns and 'FUND_DISBURSED_AMT' in df.columns:
        cat_df = df.groupby('WORK_CATEGORY')['FUND_DISBURSED_AMT'].sum().reset_index()
        cat_df = cat_df.sort_values(by='FUND_DISBURSED_AMT', ascending=False).head(10)
        cat_dist = cat_df.to_dict(orient='records')
    else:
        cat_dist = []
        
    # Utilization Brackets
    util_dist = []
    if 'SANCTION_AMOUNT' in df.columns and 'FUND_DISBURSED_AMT' in df.columns:
        util_df = df[df['SANCTION_AMOUNT'] > 0].copy()
        util_df['util_pct'] = (util_df['FUND_DISBURSED_AMT'] / util_df['SANCTION_AMOUNT']) * 100
        
        bins = [-1, 25, 50, 75, 100, 999999]
        labels = ['0-25%', '25-50%', '50-75%', '75-100%', '>100%']
        util_df['bracket'] = pd.cut(util_df['util_pct'], bins=bins, labels=labels)
        
        counts = util_df['bracket'].value_counts().reset_index()
        counts.columns = ['bracket', 'count']
        
        # ensure order
        order_map = {l: i for i, l in enumerate(labels)}
        counts['order'] = counts['bracket'].map(order_map)
        counts = counts.sort_values('order')
        util_dist = counts[['bracket', 'count']].to_dict(orient='records')

    # Fix NaNs
    import math
    def clean_rec(rec):
        for k, v in rec.items():
            if isinstance(v, float) and math.isnan(v):
                rec[k] = None
        return rec
        
    return {
        "states": [clean_rec(r) for r in states_dist],
        "categories": [clean_rec(r) for r in cat_dist],
        "utilization": util_dist
    }

@router.get("/expenditure/states")
def get_expenditure_states(db: Session = Depends(get_db)):
    engine = AnalyticsEngine(db)
    mp_df = engine.get_mp_metrics()
    
    if mp_df.empty:
        return []
        
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)
    
    # Group by STATE_NAME
    state_df = mp_df.groupby('STATE_NAME').agg(
        sanctioned=('sanctioned_amount', 'sum'),
        expenditure=('expenditure_amount', 'sum'),
        completed_works=('completed_count', 'sum'),
        ongoing_works=('ongoing_count', 'sum'),
        avg_risk=('risk_score', 'mean')
    ).reset_index()
    
    state_df['utilization'] = state_df.apply(
        lambda row: (row['expenditure'] / row['sanctioned'] * 100) if row['sanctioned'] > 0 else 0, axis=1
    )
    
    state_df = state_df.sort_values(by='expenditure', ascending=False)
    
    records = state_df.to_dict(orient='records')
    
    import math
    def clean_rec(rec):
        for k, v in rec.items():
            if isinstance(v, float) and math.isnan(v):
                rec[k] = None
        return rec
        
    return [clean_rec(r) for r in records]

@router.get("/expenditure/top-works")
def get_top_expenditure_works(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    engine = AnalyticsEngine(db)
    df = engine.get_works_database()
    
    if df.empty or 'FUND_DISBURSED_AMT' not in df.columns:
        return []
        
    # Get anomaly scores for MPs
    mp_df = engine.get_mp_metrics()
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)
    
    if not mp_df.empty:
        risk_map = mp_df[['MP_NAME', 'risk_score', 'risk_level']]
        df['join_mp'] = df['MP_NAME'].str.lower()
        risk_map['join_mp'] = risk_map['MP_NAME'].str.lower()
        df = pd.merge(df, risk_map.drop(columns=['MP_NAME']), on='join_mp', how='left')
    
    if 'risk_score' not in df.columns:
        df['risk_score'] = 0
        df['risk_level'] = 'LOW'
        
    df['risk_score'] = df['risk_score'].fillna(0)
    df['risk_level'] = df['risk_level'].fillna('LOW')
    
    df = df.sort_values(by='FUND_DISBURSED_AMT', ascending=False)
    top_df = df.head(limit)
    
    records = top_df.to_dict(orient='records')
    
    import math
    def clean_rec(rec):
        for k, v in rec.items():
            if isinstance(v, float) and math.isnan(v):
                rec[k] = None
        return rec
        
    return [clean_rec(r) for r in records]

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from typing import Optional
from app.database import get_db
from app.models import AllocatedLimit, WorkRecommended, WorkSanctioned, WorkCompleted, Expenditure
from app.services.analytics_engine import AnalyticsEngine
from app.services.ml_anomaly import MLAnomalyDetector
import pandas as pd
import numpy as np
import math
import json

router = APIRouter()

def clean_rec(rec):
    """Replace NaN/Inf float values with None for JSON serialization."""
    for k, v in rec.items():
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            rec[k] = None
    return rec


@router.get("/summary")
def get_intelligence_summary(db: Session = Depends(get_db)):
    """Executive KPIs using SQL aggregation + cached ML results."""
    engine = AnalyticsEngine(db)
    summary = engine.get_dashboard_summary()

    total_sanc_amt = db.execute(select(func.sum(WorkSanctioned.sanction_amount))).scalar() or 0
    total_exp_amt = summary["total_expenditure"] or 0
    utilization = (total_exp_amt / total_sanc_amt * 100) if total_sanc_amt > 0 else 0

    total_mps = db.execute(select(func.count(func.distinct(AllocatedLimit.mp_name)))).scalar() or 0
    total_states = db.execute(select(func.count(func.distinct(AllocatedLimit.state_name)))).scalar() or 0

    # Risk counts from cached ML
    mp_df = engine.get_mp_metrics()
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)

    high_risk = int(len(mp_df[mp_df['risk_level'] == 'HIGH'])) if not mp_df.empty else 0
    medium_risk = int(len(mp_df[mp_df['risk_level'] == 'MEDIUM'])) if not mp_df.empty else 0
    low_risk = int(len(mp_df[mp_df['risk_level'] == 'LOW'])) if not mp_df.empty else 0
    total_analyzed = len(mp_df)
    anomaly_pct = ((high_risk + medium_risk) / total_analyzed * 100) if total_analyzed > 0 else 0

    return {
        "total_allocated": float(summary["total_allocated"]),
        "total_recommended": float(summary["total_recommended"]),
        "total_sanctioned": float(total_sanc_amt),
        "total_expenditure": float(total_exp_amt),
        "total_completed": int(summary["total_completed"]),
        "total_ongoing": int(summary["total_ongoing"]),
        "overall_utilization": round(float(utilization), 1),
        "total_mps": int(total_mps),
        "total_states": int(total_states),
        "high_risk_count": high_risk,
        "medium_risk_count": medium_risk,
        "low_risk_count": low_risk,
        "anomaly_percentage": round(float(anomaly_pct), 1)
    }


@router.get("/insights")
def get_intelligence_insights(db: Session = Depends(get_db)):
    """Generate data-driven analytical insight statements from actual data."""
    engine = AnalyticsEngine(db)
    mp_df = engine.get_mp_metrics()
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)

    if mp_df.empty:
        return {"insights": []}

    insights = []
    insight_id = 0

    # 1. Expenditure concentration
    total_exp = mp_df['expenditure_amount'].sum()
    if total_exp > 0:
        state_exp = mp_df.groupby('STATE_NAME')['expenditure_amount'].sum().sort_values(ascending=False)
        total_states = len(state_exp)
        top5_exp = state_exp.head(5).sum()
        top5_pct = round(top5_exp / total_exp * 100, 1)
        top5_names = ", ".join(state_exp.head(5).index.tolist())

        if top5_pct > 50:
            insight_id += 1
            insights.append({
                "id": insight_id,
                "category": "Expenditure",
                "title": "Expenditure Concentration",
                "description": f"The top 5 states ({top5_names}) account for {top5_pct}% of all national MPLADS expenditure across {total_states} states/UTs. This concentration pattern is typical but warrants monitoring for equitable distribution.",
                "severity": "warning" if top5_pct > 70 else "info",
                "metric_value": f"{top5_pct}%",
                "related_entity": top5_names.split(",")[0].strip()
            })

    # 2. Low utilization MPs
    total_mps = len(mp_df)
    low_util_mps = mp_df[mp_df['expenditure_utilization'] < 0.3]
    low_util_count = len(low_util_mps)
    low_util_pct = round(low_util_count / total_mps * 100, 1) if total_mps > 0 else 0

    if low_util_pct > 10:
        insight_id += 1
        insights.append({
            "id": insight_id,
            "category": "Utilization",
            "title": "Low Utilization Pattern",
            "description": f"{low_util_count} MPs ({low_util_pct}% of total) show expenditure utilization below 30% of their allocated amounts. These constituencies may benefit from accelerated project execution.",
            "severity": "warning" if low_util_pct > 30 else "info",
            "metric_value": f"{low_util_pct}%",
            "related_entity": None
        })

    # 3. High utilization MPs
    high_util_mps = mp_df[mp_df['expenditure_utilization'] > 0.9]
    high_util_count = len(high_util_mps)
    if high_util_count > 0:
        insight_id += 1
        insights.append({
            "id": insight_id,
            "category": "Utilization",
            "title": "High Utilization Performers",
            "description": f"{high_util_count} MPs have achieved expenditure utilization above 90%, demonstrating effective fund deployment. These can serve as reference models.",
            "severity": "info",
            "metric_value": str(high_util_count),
            "related_entity": None
        })

    # 4. Risk signals
    high_risk = mp_df[mp_df['risk_level'] == 'HIGH']
    high_risk_count = len(high_risk)
    if high_risk_count > 0:
        high_risk_states = high_risk['STATE_NAME'].value_counts().head(3)
        states_str = ", ".join([f"{s} ({c})" for s, c in high_risk_states.items()])
        insight_id += 1
        insights.append({
            "id": insight_id,
            "category": "Risk",
            "title": "Anomaly Signals Detected",
            "description": f"The Isolation Forest model has flagged {high_risk_count} MPs with high anomaly signals. Concentration in: {states_str}. These require review — anomaly signals indicate unusual patterns, not confirmed irregularities.",
            "severity": "critical",
            "metric_value": str(high_risk_count),
            "related_entity": high_risk_states.index[0] if len(high_risk_states) > 0 else None
        })

    # 5. Completion ratio insight
    avg_completion = mp_df['completion_ratio'].mean()
    insight_id += 1
    insights.append({
        "id": insight_id,
        "category": "Works",
        "title": "National Completion Rate",
        "description": f"The average work completion ratio across all constituencies is {round(avg_completion * 100, 1)}%. " +
                       ("This is below the 50% benchmark, indicating a large backlog of ongoing works." if avg_completion < 0.5 else "This indicates reasonable project execution progress nationally."),
        "severity": "warning" if avg_completion < 0.4 else "info",
        "metric_value": f"{round(avg_completion * 100, 1)}%",
        "related_entity": None
    })

    # 6. Allocation-expenditure gap
    total_alloc = mp_df['allocated_amount'].sum()
    gap = total_alloc - total_exp
    gap_pct = round(gap / total_alloc * 100, 1) if total_alloc > 0 else 0
    if gap_pct > 20:
        insight_id += 1
        insights.append({
            "id": insight_id,
            "category": "Fund Flow",
            "title": "Allocation-Expenditure Gap",
            "description": f"There is a {gap_pct}% gap between total allocated funds and actual expenditure nationally. This represents approximately ₹{round(gap / 10000000, 0):.0f} Cr in unspent allocation.",
            "severity": "warning" if gap_pct > 40 else "info",
            "metric_value": f"{gap_pct}%",
            "related_entity": None
        })

    return {"insights": insights}


@router.get("/anomalies")
def get_intelligence_anomalies(
    limit: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Return anomaly details from cached Isolation Forest results."""
    engine = AnalyticsEngine(db)
    mp_df = engine.get_mp_metrics()
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)

    if mp_df.empty:
        return {"summary": {"total_analyzed": 0, "high_risk": 0, "medium_risk": 0, "low_risk": 0, "anomaly_pct": 0}, "anomalies": []}

    total = len(mp_df)
    high = int(len(mp_df[mp_df['risk_level'] == 'HIGH']))
    medium = int(len(mp_df[mp_df['risk_level'] == 'MEDIUM']))
    low = int(len(mp_df[mp_df['risk_level'] == 'LOW']))
    anomaly_pct = round((high + medium) / total * 100, 1) if total > 0 else 0

    # Filter
    filtered = mp_df.copy()
    if risk_level and risk_level.upper() in ('HIGH', 'MEDIUM', 'LOW'):
        filtered = filtered[filtered['risk_level'] == risk_level.upper()]

    filtered = filtered.sort_values(by='risk_score', ascending=False).head(limit)

    cols = ['MP_NAME', 'CONSTITUENCY', 'STATE_NAME', 'risk_score', 'risk_level', 'top_reasons',
            'expenditure_amount', 'sanctioned_amount', 'allocated_amount',
            'expenditure_utilization', 'completion_ratio', 'completed_count', 'ongoing_count']
    available_cols = [c for c in cols if c in filtered.columns]
    records = filtered[available_cols].to_dict(orient='records')

    for r in records:
        r = clean_rec(r)
        if 'top_reasons' in r and isinstance(r['top_reasons'], str):
            try:
                r['top_reasons'] = json.loads(r['top_reasons'])
            except:
                r['top_reasons'] = []

    return {
        "summary": {
            "total_analyzed": total,
            "high_risk": high,
            "medium_risk": medium,
            "low_risk": low,
            "anomaly_pct": anomaly_pct
        },
        "anomalies": [clean_rec(r) for r in records]
    }


@router.get("/priorities")
def get_intelligence_priorities(db: Session = Depends(get_db)):
    """Return priority areas for review."""
    engine = AnalyticsEngine(db)
    mp_df = engine.get_mp_metrics()
    ml = MLAnomalyDetector()
    mp_df = ml.detect_anomalies(mp_df)

    if mp_df.empty:
        return {"top_risk_mps": [], "lowest_util_states": [], "highest_exp_states": [], "highest_ongoing_states": []}

    # Top risk MPs
    top_risk = mp_df.sort_values('risk_score', ascending=False).head(10)
    top_risk_cols = ['MP_NAME', 'CONSTITUENCY', 'STATE_NAME', 'risk_score', 'risk_level',
                     'expenditure_amount', 'sanctioned_amount', 'expenditure_utilization', 'completion_ratio', 'top_reasons']
    top_risk_cols = [c for c in top_risk_cols if c in top_risk.columns]
    top_risk_records = top_risk[top_risk_cols].to_dict(orient='records')
    for r in top_risk_records:
        r = clean_rec(r)
        if 'top_reasons' in r and isinstance(r['top_reasons'], str):
            try:
                r['top_reasons'] = json.loads(r['top_reasons'])
            except:
                r['top_reasons'] = []

    # State aggregations
    state_df = mp_df.groupby('STATE_NAME').agg(
        expenditure=('expenditure_amount', 'sum'),
        sanctioned=('sanctioned_amount', 'sum'),
        completed=('completed_count', 'sum'),
        ongoing=('ongoing_count', 'sum'),
        avg_risk=('risk_score', 'mean')
    ).reset_index()
    state_df['utilization'] = state_df.apply(
        lambda r: round(r['expenditure'] / r['sanctioned'] * 100, 1) if r['sanctioned'] > 0 else 0, axis=1
    )

    # Lowest utilization states
    lowest_util = state_df.sort_values('utilization').head(5).to_dict(orient='records')

    # Highest expenditure states
    highest_exp = state_df.sort_values('expenditure', ascending=False).head(5).to_dict(orient='records')

    # Highest ongoing
    highest_ongoing = state_df.sort_values('ongoing', ascending=False).head(5).to_dict(orient='records')

    return {
        "top_risk_mps": [clean_rec(r) for r in top_risk_records],
        "lowest_util_states": [clean_rec(r) for r in lowest_util],
        "highest_exp_states": [clean_rec(r) for r in highest_exp],
        "highest_ongoing_states": [clean_rec(r) for r in highest_ongoing]
    }


@router.get("/trends")
def get_intelligence_trends(db: Session = Depends(get_db)):
    """Analyze actual date columns for trend data."""
    engine = AnalyticsEngine(db)
    df = engine.get_works_database()

    result = {
        "recommendations": [],
        "sanctions": [],
        "expenditures": [],
        "completions": []
    }

    if df.empty:
        return result

    def extract_monthly(dataframe, date_col, amount_col=None):
        """Extract monthly counts and optional amounts."""
        if date_col not in dataframe.columns:
            return []
        temp = dataframe[[date_col] + ([amount_col] if amount_col and amount_col in dataframe.columns else [])].copy()
        temp[date_col] = pd.to_datetime(temp[date_col], errors='coerce')
        temp = temp.dropna(subset=[date_col])
        if temp.empty:
            return []
        temp['month'] = temp[date_col].dt.to_period('M').astype(str)
        grouped = temp.groupby('month').agg(count=(date_col, 'count')).reset_index()
        if amount_col and amount_col in temp.columns:
            amt_grouped = temp.groupby('month')[amount_col].sum().reset_index()
            amt_grouped.columns = ['month', 'amount']
            grouped = pd.merge(grouped, amt_grouped, on='month', how='left')
            grouped['amount'] = grouped['amount'].fillna(0)
        else:
            grouped['amount'] = 0
        grouped = grouped.sort_values('month')
        records = grouped.to_dict(orient='records')
        return [clean_rec(r) for r in records]

    result["recommendations"] = extract_monthly(df, 'RECOMMENDATION_DATE', 'RECOMMENDED_AMOUNT')
    result["sanctions"] = extract_monthly(df, 'SANCTION_DATE', 'SANCTION_AMOUNT')
    result["expenditures"] = extract_monthly(df, 'EXPENDITURE_DATE', 'FUND_DISBURSED_AMT')
    result["completions"] = extract_monthly(df, 'ACTUAL_END_DATE', 'ACTUAL_AMOUNT')

    return result

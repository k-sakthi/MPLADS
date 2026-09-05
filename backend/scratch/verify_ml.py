import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
from app.database import SessionLocal
from app.services.analytics_engine import AnalyticsEngine
from app.services.ml_anomaly import MLAnomalyDetector

def verify():
    db = SessionLocal()
    engine = AnalyticsEngine(db)
    
    print("Fetching MP metrics...")
    df = engine.get_mp_metrics()
    
    if df.empty:
        print("No data available.")
        return
        
    print(f"Total MPs analyzed: {len(df)}")
    print(f"Features generated: {list(df.columns)}")
    
    print("Running ML Anomaly Detection (Isolation Forest)...")
    ml = MLAnomalyDetector(contamination=0.1)
    df = ml.detect_anomalies(df)
    
    anomalies = df[df['risk_level'].isin(['HIGH', 'MEDIUM'])].sort_values(by='risk_score', ascending=False)
    
    print(f"\nTotal Anomalies Detected: {len(anomalies)} (High/Medium Risk)")
    print("="*60)
    
    for i, row in anomalies.head(5).iterrows():
        print(f"MP: {row['MP_NAME']} ({row['CONSTITUENCY']}, {row['STATE_NAME']})")
        print(f"Risk Score: {row['risk_score']} ({row['risk_level']})")
        print(f"Allocated: {row['allocated_amount']:,.0f} | Sanctioned: {row['sanctioned_amount']:,.0f} | Exp: {row['expenditure_amount']:,.0f}")
        print("Reasons:")
        reasons = json.loads(row['top_reasons'])
        for r in reasons:
            print(f" - {r}")
        print("-" * 30)

if __name__ == "__main__":
    verify()

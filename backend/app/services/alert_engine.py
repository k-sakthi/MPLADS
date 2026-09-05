import hashlib
import json
import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
import pandas as pd
import numpy as np
import math

from app.models import Alert
from app.services.analytics_engine import AnalyticsEngine
from app.services.ml_anomaly import MLAnomalyDetector


class AlertEngine:
    def __init__(self, db: Session):
        self.db = db
        self.current_month = datetime.datetime.now().strftime("%Y-%m")

    def _generate_fingerprint(self, alert_type: str, entity_name: str) -> str:
        """Generates a unique fingerprint for the alert to prevent duplicates."""
        raw_string = f"{alert_type}_{entity_name}_{self.current_month}"
        return hashlib.md5(raw_string.encode()).hexdigest()
        
    def _clean_float(self, value):
        """Convert nan/inf to None for database storage."""
        if value is None:
            return None
        if isinstance(value, float):
            if math.isnan(value) or math.isinf(value):
                return None
        return float(value)

    def generate_alerts(self) -> dict:
        """Generates alerts based on analytics data and ML anomaly results."""
        engine = AnalyticsEngine(self.db)
        mp_df = engine.get_mp_metrics()
        
        if mp_df.empty:
            return {"status": "success", "new_alerts": 0, "message": "No data available"}

        ml = MLAnomalyDetector()
        mp_df = ml.detect_anomalies(mp_df)
        
        new_alerts_count = 0
        type_counts = {
            "HIGH_ANOMALY": 0,
            "LOW_UTILIZATION": 0,
            "HIGH_UTILIZATION": 0,
            "SPENDING_CONCENTRATION": 0
        }

        # 1. MP-level alerts
        for _, row in mp_df.iterrows():
            mp_name = str(row.get('MP_NAME', 'Unknown'))
            state_name = str(row.get('STATE_NAME', ''))
            constituency = str(row.get('CONSTITUENCY', ''))
            
            # HIGH ANOMALY SIGNAL
            if row.get('risk_level') == 'HIGH':
                top_reasons = row.get('top_reasons', [])
                if isinstance(top_reasons, str):
                    try:
                        top_reasons = json.loads(top_reasons)
                    except:
                        top_reasons = []
                        
                reason_text = top_reasons[0] if top_reasons else "Statistical deviation identified."
                desc = f"Multiple financial features differ significantly from the observed pattern. {reason_text}"
                
                fingerprint = self._generate_fingerprint("HIGH_ANOMALY", mp_name)
                alert = Alert(
                    fingerprint=fingerprint,
                    alert_type="HIGH_ANOMALY",
                    priority="HIGH",
                    entity_type="MP",
                    entity_name=mp_name,
                    state_name=state_name,
                    constituency=constituency,
                    metric_name="Anomaly Score",
                    observed_value=self._clean_float(row.get('risk_score')),
                    reference_value=None,
                    description=desc,
                    status="OPEN"
                )
                if self._upsert_alert(alert):
                    new_alerts_count += 1
                    type_counts["HIGH_ANOMALY"] += 1

            # LOW UTILIZATION
            utilization = row.get('expenditure_utilization', 0)
            if utilization < 0.3:
                fingerprint = self._generate_fingerprint("LOW_UTILIZATION", mp_name)
                alert = Alert(
                    fingerprint=fingerprint,
                    alert_type="LOW_UTILIZATION",
                    priority="MEDIUM",
                    entity_type="MP",
                    entity_name=mp_name,
                    state_name=state_name,
                    constituency=constituency,
                    metric_name="Utilization",
                    observed_value=self._clean_float(utilization * 100),
                    reference_value=30.0,
                    description="Sanctioned funds exist but observed expenditure is comparatively low.",
                    status="OPEN"
                )
                if self._upsert_alert(alert):
                    new_alerts_count += 1
                    type_counts["LOW_UTILIZATION"] += 1

            # HIGH UTILIZATION
            if utilization > 0.95:
                fingerprint = self._generate_fingerprint("HIGH_UTILIZATION", mp_name)
                alert = Alert(
                    fingerprint=fingerprint,
                    alert_type="HIGH_UTILIZATION",
                    priority="INFO",
                    entity_type="MP",
                    entity_name=mp_name,
                    state_name=state_name,
                    constituency=constituency,
                    metric_name="Utilization",
                    observed_value=self._clean_float(utilization * 100),
                    reference_value=95.0,
                    description="Expenditure is unusually close to or above sanctioned amount.",
                    status="OPEN"
                )
                if self._upsert_alert(alert):
                    new_alerts_count += 1
                    type_counts["HIGH_UTILIZATION"] += 1

        # 2. State-level alerts (SPENDING_CONCENTRATION)
        total_national_expenditure = mp_df['expenditure_amount'].sum()
        if total_national_expenditure > 0:
            state_df = mp_df.groupby('STATE_NAME')['expenditure_amount'].sum().reset_index()
            for _, row in state_df.iterrows():
                state_exp = row['expenditure_amount']
                state_pct = state_exp / total_national_expenditure
                
                if state_pct > 0.20: # State holds > 20% of national expenditure
                    state_name = str(row['STATE_NAME'])
                    fingerprint = self._generate_fingerprint("SPENDING_CONCENTRATION", state_name)
                    alert = Alert(
                        fingerprint=fingerprint,
                        alert_type="SPENDING_CONCENTRATION",
                        priority="MEDIUM",
                        entity_type="STATE",
                        entity_name=state_name,
                        state_name=state_name,
                        constituency=None,
                        metric_name="National Share",
                        observed_value=self._clean_float(state_pct * 100),
                        reference_value=20.0,
                        description=f"Unusually high expenditure concentration. This state accounts for {state_pct*100:.1f}% of national expenditure.",
                        status="OPEN"
                    )
                    if self._upsert_alert(alert):
                        new_alerts_count += 1
                        type_counts["SPENDING_CONCENTRATION"] += 1

        return {
            "status": "success",
            "new_alerts_generated": new_alerts_count,
            "type_counts": type_counts
        }

    def _upsert_alert(self, alert: Alert) -> bool:
        """Attempts to add a new alert. Ignores if fingerprint already exists. Returns True if inserted."""
        try:
            # Check if exists first to avoid constant rollback overhead
            existing = self.db.query(Alert).filter(Alert.fingerprint == alert.fingerprint).first()
            if existing:
                return False
                
            self.db.add(alert)
            self.db.commit()
            return True
        except IntegrityError:
            self.db.rollback()
            return False
        except Exception as e:
            self.db.rollback()
            print(f"Error inserting alert: {e}")
            return False

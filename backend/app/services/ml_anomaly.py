import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import logging
import time
import threading

logger = logging.getLogger(__name__)

_ML_CACHE = {}
_ML_CACHE_TTL = 300 # 5 minutes
_ML_CACHE_LOCK = threading.Lock()

class MLAnomalyDetector:
    def __init__(self, contamination=0.1):
        self.contamination = contamination
        self.features = [
            'expenditure_utilization',
            'sanction_ratio',
            'completion_ratio',
            'avg_work_cost',
            'sanctioned_count'
        ]

    def detect_anomalies(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty or len(df) < 5:
            # Not enough data for meaningful ML
            df['risk_score'] = 0
            df['risk_level'] = 'LOW'
            df['top_reasons'] = '[]'
            return df
            
        global _ML_CACHE, _ML_CACHE_LOCK
        cache_key = f"ml_anomalies_{len(df)}"
        
        with _ML_CACHE_LOCK:
            now = time.time()
            if cache_key in _ML_CACHE and now - _ML_CACHE[cache_key]['time'] < _ML_CACHE_TTL:
                return _ML_CACHE[cache_key]['data'].copy()

            # --- START ML EXECUTION UNDER LOCK ---
            # Prepare features
            X = df[self.features].copy()
            
            # Fill any remaining NaNs or infinite values
            X = X.replace([np.inf, -np.inf], np.nan)
            X = X.fillna(0)
    
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
    
            # Train Isolation Forest
            iso_forest = IsolationForest(
                n_estimators=100, 
                contamination=self.contamination, 
                random_state=42
            )
            
            iso_forest.fit(X_scaled)
            
            # Anomaly Score
            raw_scores = iso_forest.score_samples(X_scaled)
            
            # Normalize to 0-100
            min_score = raw_scores.min()
            max_score = raw_scores.max()
            if max_score > min_score:
                normalized = 100 * (max_score - raw_scores) / (max_score - min_score)
            else:
                normalized = np.zeros(len(raw_scores))
                
            df['risk_score'] = np.round(normalized, 1)
    
            # Determine Risk Level
            def get_risk_level(score):
                if score >= 75:
                    return "HIGH"
                elif score >= 50:
                    return "MEDIUM"
                return "LOW"
                
            df['risk_level'] = df['risk_score'].apply(get_risk_level)
    
            # Generate Explainable Reasons
            medians = X.median()
            stds = X.std()
            
            reasons_list = []
            for idx, row in X.iterrows():
                reasons = []
                risk_lvl = df.at[idx, 'risk_level']
                
                if risk_lvl in ['HIGH', 'MEDIUM']:
                    if row['expenditure_utilization'] > (medians['expenditure_utilization'] + 2 * stds['expenditure_utilization']):
                        reasons.append("Unusual spending pattern: Expenditure utilization is significantly higher than peers.")
                    elif row['expenditure_utilization'] < (medians['expenditure_utilization'] - 1.5 * stds['expenditure_utilization']):
                        reasons.append("Unusually low expenditure utilization compared to peers.")
                        
                    if row['completion_ratio'] < (medians['completion_ratio'] - 1.5 * stds['completion_ratio']):
                        reasons.append("Unusual completion pattern: High number of sanctioned works but very low completion rate.")
                        
                    if row['avg_work_cost'] > (medians['avg_work_cost'] + 2 * stds['avg_work_cost']):
                        reasons.append("High risk indicator: Average cost per work is exceptionally high.")
                        
                    if row['sanction_ratio'] > (medians['sanction_ratio'] + 2 * stds['sanction_ratio']):
                        reasons.append("Potential anomaly: Sanctioned amount exceeds strictly recommended amounts by a large margin.")
                        
                    if not reasons:
                        reasons.append("Model detected multi-dimensional outlier combining several minor deviations.")
                
                reasons_list.append(reasons)
                
            import json
            df['top_reasons'] = [json.dumps(r) for r in reasons_list]
    
            # Save to cache before releasing lock
            _ML_CACHE[cache_key] = {
                'time': time.time(),
                'data': df.copy()
            }
    
            return df

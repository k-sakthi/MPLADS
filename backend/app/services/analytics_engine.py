import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models import AllocatedLimit, WorkRecommended, WorkSanctioned, WorkCompleted, Expenditure
import time
import threading

# Simple global cache for expensive dataframe operations
_CACHE = {}
_CACHE_TTL = 300 # 5 minutes
_CACHE_LOCK = threading.Lock()

class AnalyticsEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_summary(self) -> dict:
        """
        Uses raw SQL aggregation for instant dashboard metrics.
        Avoids Pandas entirely.
        """
        total_allocated = self.db.execute(select(func.sum(AllocatedLimit.allocated_amt))).scalar() or 0
        total_recommended = self.db.execute(select(func.sum(WorkRecommended.recommended_amount))).scalar() or 0
        total_sanctioned = self.db.execute(select(func.sum(WorkSanctioned.sanction_amount))).scalar() or 0
        total_expenditure = self.db.execute(select(func.sum(Expenditure.fund_disbursed_amt))).scalar() or 0
        total_completed = self.db.execute(select(func.count(WorkCompleted.id))).scalar() or 0
        total_sanctioned_count = self.db.execute(select(func.count(WorkSanctioned.id))).scalar() or 0
        
        ongoing_count = total_sanctioned_count - total_completed
        if ongoing_count < 0: ongoing_count = 0
        
        return {
            "total_allocated": total_allocated,
            "total_recommended": total_recommended,
            "total_sanctioned": total_sanctioned,
            "total_expenditure": total_expenditure,
            "total_completed": total_completed,
            "total_ongoing": ongoing_count
        }

    def get_mp_metrics(self) -> pd.DataFrame:
        """
        Aggregates metrics for each MP / Constituency using native SQL to bypass loading full datasets.
        """
        global _CACHE, _CACHE_LOCK
        cache_key = "mp_metrics"
        
        with _CACHE_LOCK:
            now = time.time()
            if cache_key in _CACHE and now - _CACHE[cache_key]['time'] < _CACHE_TTL:
                return _CACHE[cache_key]['data'].copy()
                
            # Fetch base list of MPs from AllocatedLimits (one per MP/Constituency)
            alloc_records = self.db.execute(
                select(
                    AllocatedLimit.mp_name.label("MP_NAME"),
                    AllocatedLimit.constituency.label("CONSTITUENCY"),
                    AllocatedLimit.state_name.label("STATE_NAME"),
                    AllocatedLimit.allocated_amt.label("allocated_amount"),
                    AllocatedLimit.house_of_parliament.label("HOUSE_OF_PARLIAMENT")
                )
            ).all()

            if not alloc_records:
                return pd.DataFrame()

            mp_data = pd.DataFrame(alloc_records)
            
            if 'CONSTITUENCY' in mp_data.columns:
                mp_data['CONSTITUENCY'] = mp_data['CONSTITUENCY'].astype(str).str.strip().str.upper()
            if 'STATE_NAME' in mp_data.columns:
                mp_data['STATE_NAME'] = mp_data['STATE_NAME'].astype(str).str.strip().str.upper()
            if 'HOUSE_OF_PARLIAMENT' in mp_data.columns:
                mp_data['HOUSE_OF_PARLIAMENT'] = mp_data['HOUSE_OF_PARLIAMENT'].astype(str).map({'1': 'Rajya Sabha', '2': 'Lok Sabha'}).fillna('Lok Sabha')

            # Works Recommended
            rec_agg = self.db.execute(
                select(
                    func.upper(func.trim(WorkRecommended.constituency)).label("CONSTITUENCY"),
                    func.upper(func.trim(WorkRecommended.state_name)).label("STATE_NAME"),
                    func.sum(WorkRecommended.recommended_amount).label("recommended_amount"),
                    func.count(WorkRecommended.id).label("recommended_count")
                ).group_by(
                    func.upper(func.trim(WorkRecommended.constituency)),
                    func.upper(func.trim(WorkRecommended.state_name))
                )
            ).all()
            df_rec = pd.DataFrame(rec_agg)
            
            if not df_rec.empty:
                mp_data = pd.merge(mp_data, df_rec, on=['CONSTITUENCY', 'STATE_NAME'], how='left')
            else:
                mp_data['recommended_amount'] = 0.0
                mp_data['recommended_count'] = 0

            # Works Sanctioned
            sanc_agg = self.db.execute(
                select(
                    func.upper(func.trim(WorkSanctioned.constituency)).label("CONSTITUENCY"),
                    func.upper(func.trim(WorkSanctioned.state_name)).label("STATE_NAME"),
                    func.sum(WorkSanctioned.sanction_amount).label("sanctioned_amount"),
                    func.count(WorkSanctioned.id).label("sanctioned_count")
                ).group_by(
                    func.upper(func.trim(WorkSanctioned.constituency)),
                    func.upper(func.trim(WorkSanctioned.state_name))
                )
            ).all()
            df_sanc = pd.DataFrame(sanc_agg)
            
            if not df_sanc.empty:
                mp_data = pd.merge(mp_data, df_sanc, on=['CONSTITUENCY', 'STATE_NAME'], how='left')
            else:
                mp_data['sanctioned_amount'] = 0.0
                mp_data['sanctioned_count'] = 0

            # Works Completed
            comp_agg = self.db.execute(
                select(
                    func.upper(func.trim(WorkCompleted.constituency)).label("CONSTITUENCY"),
                    func.upper(func.trim(WorkCompleted.state_name)).label("STATE_NAME"),
                    func.count(WorkCompleted.id).label("completed_count")
                ).group_by(
                    func.upper(func.trim(WorkCompleted.constituency)),
                    func.upper(func.trim(WorkCompleted.state_name))
                )
            ).all()
            df_comp = pd.DataFrame(comp_agg)

            if not df_comp.empty:
                mp_data = pd.merge(mp_data, df_comp, on=['CONSTITUENCY', 'STATE_NAME'], how='left')
            else:
                mp_data['completed_count'] = 0

            # Expenditure
            exp_agg = self.db.execute(
                select(
                    func.upper(func.trim(Expenditure.constituency)).label("CONSTITUENCY"),
                    func.upper(func.trim(Expenditure.state_name)).label("STATE_NAME"),
                    func.sum(Expenditure.fund_disbursed_amt).label("expenditure_amount")
                ).group_by(
                    func.upper(func.trim(Expenditure.constituency)),
                    func.upper(func.trim(Expenditure.state_name))
                )
            ).all()
            df_exp = pd.DataFrame(exp_agg)

            if not df_exp.empty:
                mp_data = pd.merge(mp_data, df_exp, on=['CONSTITUENCY', 'STATE_NAME'], how='left')
            else:
                mp_data['expenditure_amount'] = 0.0

            # Fill NaNs with 0 for numeric cols
            num_cols = ['allocated_amount', 'recommended_amount', 'recommended_count', 
                        'sanctioned_amount', 'sanctioned_count', 'expenditure_amount', 'completed_count']
            
            # Ensure columns exist before filling na
            for col in num_cols:
                if col not in mp_data.columns:
                    mp_data[col] = 0.0
            
            mp_data[num_cols] = mp_data[num_cols].fillna(0)
    
            # Derived Metrics
            mp_data['ongoing_count'] = mp_data['sanctioned_count'] - mp_data['completed_count']
            mp_data['ongoing_count'] = mp_data['ongoing_count'].clip(lower=0)
            
            # Calculate Utilization Ratios safely
            mp_data['expenditure_utilization'] = mp_data.apply(
                lambda row: (row['expenditure_amount'] / row['allocated_amount']) if row['allocated_amount'] > 0 else 0, axis=1
            )
            mp_data['sanction_ratio'] = mp_data.apply(
                lambda row: (row['sanctioned_amount'] / row['recommended_amount']) if row['recommended_amount'] > 0 else 0, axis=1
            )
            mp_data['completion_ratio'] = mp_data.apply(
                lambda row: (row['completed_count'] / row['sanctioned_count']) if row['sanctioned_count'] > 0 else 0, axis=1
            )
            mp_data['avg_work_cost'] = mp_data.apply(
                lambda row: (row['sanctioned_amount'] / row['sanctioned_count']) if row['sanctioned_count'] > 0 else 0, axis=1
            )
            
            _CACHE[cache_key] = {
                'time': now,
                'data': mp_data.copy()
            }
            return mp_data

    def get_works_database(self) -> pd.DataFrame:
        """
        Creates a unified Works dataframe by joining Recommended, Sanctioned, Completed, and Expenditure on WORK_RECOMMENDATION_DTL_ID.
        Uses a robust concatenation and aggregation approach to prevent data loss if a table is partially fetched.
        """
        cache_key = "works_db"
        now = time.time()
        
        with _CACHE_LOCK:
            cached = _CACHE.get(cache_key)
            if cached and now - cached['time'] < 300:
                return cached['data'].copy()
                
            # Fetch raw data
            rec_records = self.db.execute(select(WorkRecommended.raw_data)).scalars().all()
            sanc_records = self.db.execute(select(WorkSanctioned.raw_data)).scalars().all()
            exp_records = self.db.execute(select(Expenditure.raw_data)).scalars().all()
            comp_records = self.db.execute(select(WorkCompleted.raw_data)).scalars().all()

        df_rec = pd.DataFrame(rec_records) if rec_records else pd.DataFrame()
        df_sanc = pd.DataFrame(sanc_records) if sanc_records else pd.DataFrame()
        df_exp = pd.DataFrame(exp_records) if exp_records else pd.DataFrame()
        df_comp = pd.DataFrame(comp_records) if comp_records else pd.DataFrame()

        all_dfs = []
        
        # Process Recommended
        if not df_rec.empty and 'WORK_RECOMMENDATION_DTL_ID' in df_rec.columns:
            cols_rec = ['WORK_RECOMMENDATION_DTL_ID', 'MP_NAME', 'STATE_NAME', 'CONSTITUENCY', 
                        'WORK_CATEGORY', 'ACTIVITY_NAME', 'WORK_DESCRIPTION', 'RECOMMENDED_AMOUNT', 'RECOMMENDATION_DATE']
            df1 = df_rec[[c for c in cols_rec if c in df_rec.columns]].copy()
            df1 = df1.groupby('WORK_RECOMMENDATION_DTL_ID').first().reset_index()
            all_dfs.append(df1)

        # Process Sanctioned
        if not df_sanc.empty and 'WORK_RECOMMENDATION_DTL_ID' in df_sanc.columns:
            cols_sanc = ['WORK_RECOMMENDATION_DTL_ID', 'MP_NAME', 'STATE_NAME', 'CONSTITUENCY', 
                        'WORK_CATEGORY', 'ACTIVITY_NAME', 'WORK_DESCRIPTION', 'SANCTION_AMOUNT', 'SANCTION_DATE', 'WORK_STAGE']
            df2 = df_sanc[[c for c in cols_sanc if c in df_sanc.columns]].copy()
            df2 = df2.groupby('WORK_RECOMMENDATION_DTL_ID').first().reset_index()
            all_dfs.append(df2)

        # Process Expenditure
        if not df_exp.empty and 'WORK_RECOMMENDATION_DTL_ID' in df_exp.columns:
            cols_exp = ['WORK_RECOMMENDATION_DTL_ID', 'MP_NAME', 'STATE_NAME', 'CONSTITUENCY', 
                        'ACTIVITY_NAME', 'FUND_DISBURSED_AMT', 'EXPENDITURE_DATE', 'WORK_STATUS']
            df3 = df_exp[[c for c in cols_exp if c in df_exp.columns]].copy()
            # Aggregate multiple disbursements for the same work
            agg_dict = {'FUND_DISBURSED_AMT': 'sum'}
            for c in df3.columns:
                if c not in ['WORK_RECOMMENDATION_DTL_ID', 'FUND_DISBURSED_AMT']:
                    agg_dict[c] = 'last'
            df3 = df3.groupby('WORK_RECOMMENDATION_DTL_ID').agg(agg_dict).reset_index()
            all_dfs.append(df3)
            
        # Process Completed
        if not df_comp.empty and 'WORK_RECOMMENDATION_DTL_ID' in df_comp.columns:
            cols_comp = ['WORK_RECOMMENDATION_DTL_ID', 'MP_NAME', 'STATE_NAME', 'CONSTITUENCY', 
                        'WORK_CATEGORY', 'ACTIVITY_NAME', 'WORK_DESCRIPTION', 'ACTUAL_AMOUNT', 'ACTUAL_END_DATE', 'WORK_ID']
            df4 = df_comp[[c for c in cols_comp if c in df_comp.columns]].copy()
            df4 = df4.groupby('WORK_RECOMMENDATION_DTL_ID').first().reset_index()
            all_dfs.append(df4)

        if not all_dfs:
            return pd.DataFrame()
            
        # Combine everything vertically
        combined = pd.concat(all_dfs, ignore_index=True)
        
        # Aggregate back to one row per WORK_RECOMMENDATION_DTL_ID
        agg_dict_final = {}
        for col in combined.columns:
            if col == 'WORK_RECOMMENDATION_DTL_ID':
                continue
            elif col in ['RECOMMENDED_AMOUNT', 'SANCTION_AMOUNT', 'FUND_DISBURSED_AMT', 'ACTUAL_AMOUNT']:
                agg_dict_final[col] = 'max' # Numeric amounts come from their distinct source tables
            else:
                agg_dict_final[col] = 'first' # Take first available descriptive string
                
        master_df = combined.groupby('WORK_RECOMMENDATION_DTL_ID').agg(agg_dict_final).reset_index()

        # Fill NaNs where appropriate
        numeric_cols = ['RECOMMENDED_AMOUNT', 'SANCTION_AMOUNT', 'FUND_DISBURSED_AMT', 'ACTUAL_AMOUNT']
        for col in numeric_cols:
            if col in master_df.columns:
                master_df[col] = master_df[col].fillna(0)

        # Standardize strings
        if 'STATE_NAME' in master_df.columns:
            master_df['STATE_NAME'] = master_df['STATE_NAME'].astype(str).str.strip().str.title()
        if 'WORK_STATUS' in master_df.columns:
            master_df['WORK_STATUS'] = master_df['WORK_STATUS'].fillna('Unknown')
        if 'WORK_STAGE' in master_df.columns:
            master_df['WORK_STAGE'] = master_df['WORK_STAGE'].fillna('Unknown')

        with _CACHE_LOCK:
            _CACHE[cache_key] = {
                'time': now,
                'data': master_df.copy()
            }

        return master_df

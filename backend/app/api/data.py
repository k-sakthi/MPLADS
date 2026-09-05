from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import pandas as pd
import logging

logger = logging.getLogger(__name__)

from app.database import get_db
from app.schemas.data import StatusResponse, ProfileResponse
from app.models import (
    DataRefreshLog, AllocatedLimit, WorkRecommended, 
    WorkSanctioned, WorkCompleted, Expenditure, CalamityConsent
)
from app.services.mplads_fetcher import MPLADSFetcher, REPORTS
from app.config import settings

router = APIRouter()
fetcher = MPLADSFetcher()

# Map report keys to models
MODEL_MAP = {
    "allocated_limit": AllocatedLimit,
    "works_recommended": WorkRecommended,
    "works_sanctioned": WorkSanctioned,
    "works_completed": WorkCompleted,
    "expenditure": Expenditure,
    "calamity": CalamityConsent
}

async def process_report_data(report_key: str, data: list, db: Session, log_id: int):
    if not data:
        return
        
    model = MODEL_MAP[report_key]
    
    # Delete old data (for phase 1, simple replacement)
    db.query(model).delete()
    
    # Insert new data
    objects_to_insert = []
    for record in data:
        # Extract common fields safely
        mp_name = record.get("MP_NAME")
        state_name = record.get("STATE_NAME")
        constituency = record.get("CONSTITUENCY")
        
        # specific fields based on report type
        kwargs = {
            "mp_name": mp_name,
            "raw_data": record,
            "refresh_log_id": log_id
        }
        
        if report_key == "allocated_limit":
            kwargs.update({
                "state_name": state_name,
                "constituency": constituency,
                "house_of_parliament": record.get("HOUSE_OF_PARLIAMENT"),
                "allocated_amt": record.get("ALLOCATED_AMT")
            })
        elif report_key == "works_recommended":
            kwargs.update({
                "state_name": state_name,
                "constituency": constituency,
                "work_category": record.get("WORK_CATEGORY"),
                "recommended_amount": record.get("RECOMMENDED_AMOUNT") # Check actual field name if needed
            })
        elif report_key == "works_sanctioned":
             kwargs.update({
                "state_name": state_name,
                "constituency": constituency,
                "work_stage": record.get("WORK_STAGE"),
                "sanction_amount": record.get("SANCTION_AMOUNT")
            })
        elif report_key == "works_completed":
             kwargs.update({
                "state_name": state_name,
                "constituency": constituency,
                "work_id": str(record.get("WORK_ID", "")),
                "actual_amount": record.get("ACTUAL_AMOUNT")
            })
        elif report_key == "expenditure":
             kwargs.update({
                "state_name": state_name,
                "constituency": constituency,
                "work_id": str(record.get("WORK_ID", "")),
                "vendor_name": record.get("VENDOR_NAME"),
                "fund_disbursed_amt": record.get("FUND_DISBURSED_AMT")
            })
        elif report_key == "calamity":
             kwargs.update({
                "calamity_name": record.get("CALAMITY_NAME"),
                "consented_amount": record.get("CONSENTED_AMOUNT")
            })
            
        objects_to_insert.append(model(**kwargs))
        
    db.bulk_save_objects(objects_to_insert)
    db.commit()

async def fetch_and_store_data():
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        for key in REPORTS.keys():
            log_entry = DataRefreshLog(report_name=key, status="IN_PROGRESS")
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            
            try:
                data = await fetcher.fetch_report(key)
                if data:
                    await process_report_data(key, data, db, log_entry.id)
                    log_entry.status = "SUCCESS"
                    log_entry.records_fetched = len(data)
                else:
                    log_entry.status = "WARNING"
                    log_entry.error_message = "No data returned or parsing failed."
            except Exception as e:
                logger.exception(f"Error fetching {key}")
                log_entry.status = "ERROR"
                log_entry.error_message = repr(e)
                
            db.commit()
    finally:
        db.close()

@router.post("/refresh")
async def refresh_data(background_tasks: BackgroundTasks):
    background_tasks.add_task(fetch_and_store_data)
    return {"message": "Data refresh triggered successfully in the background."}

@router.get("/status", response_model=StatusResponse)
async def get_status(db: Session = Depends(get_db)):
    # Get last successful refresh
    last_log = db.query(DataRefreshLog).filter(DataRefreshLog.status == "SUCCESS").order_by(DataRefreshLog.timestamp.desc()).first()
    
    datasets_count = {}
    for key, model in MODEL_MAP.items():
        count = db.query(model).count()
        datasets_count[key] = count
        
    status = "Source Connected" if last_log else "Source Unavailable or Not Fetched"
    
    errors = []
    error_logs = db.query(DataRefreshLog).filter(DataRefreshLog.status == "ERROR").order_by(DataRefreshLog.timestamp.desc()).limit(5).all()
    for e in error_logs:
        errors.append(f"{e.report_name}: {e.error_message}")
        
    return StatusResponse(
        last_successful_refresh=last_log.timestamp if last_log else None,
        data_source_status=status,
        datasets=datasets_count,
        errors=errors
    )

@router.get("/profile", response_model=List[ProfileResponse])
async def get_profiles(db: Session = Depends(get_db)):
    profiles = []
    for key, model in MODEL_MAP.items():
        records = db.query(model.raw_data).all()
        if not records:
            continue
            
        df = pd.DataFrame([r[0] for r in records])
        
        profile = ProfileResponse(
            report_name=REPORTS[key],
            row_count=len(df),
            column_names=list(df.columns),
            missing_value_counts=df.isnull().sum().to_dict(),
            duplicate_row_count=df.duplicated().sum()
        )
        profiles.append(profile)
        
    return profiles

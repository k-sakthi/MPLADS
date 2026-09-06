import time
from sqlalchemy import text
from app.database import get_db
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter()

START_TIME = time.time()

class HealthResponse(BaseModel):
    status: str
    database: str
    uptime: float

@router.get("", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    db_status = "error"
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        pass
        
    return {
        "status": "ok",
        "database": db_status,
        "uptime": time.time() - START_TIME
    }

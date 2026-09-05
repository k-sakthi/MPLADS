from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class StatusResponse(BaseModel):
    last_successful_refresh: Optional[datetime] = None
    data_source_status: str
    datasets: Dict[str, int]
    errors: List[str] = []

class ProfileResponse(BaseModel):
    report_name: str
    row_count: int
    column_names: List[str]
    missing_value_counts: Dict[str, int]
    duplicate_row_count: int

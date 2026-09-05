import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MPLADS Sentinel AI"
    # Provide a default SQLite URL for local dev if Postgres isn't set
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mplads.db")
    MPLADS_API_URL: str = "https://mplads.mospi.gov.in/rest/PreLoginDashboardData/getTilesReportData"
    API_TIMEOUT_SECONDS: int = 300
    CORS_ORIGINS: list = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()

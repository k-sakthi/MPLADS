import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MPLADS Sentinel AI"
    # Provide a default SQLite URL for local dev if Postgres isn't set
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mplads.db")
    MPLADS_API_URL: str = "https://mplads.mospi.gov.in/rest/PreLoginDashboardData/getTilesReportData"
    API_TIMEOUT_SECONDS: int = 300
    # CORS configuration using FRONTEND_URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    @property
    def CORS_ORIGINS(self) -> list:
        return [url.strip() for url in self.FRONTEND_URL.split(",") if url.strip()]
    
    class Config:
        env_file = ".env"

settings = Settings()

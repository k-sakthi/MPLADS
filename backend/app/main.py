from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import data, health, analytics, geography, intelligence, alerts, audit, reports
from app.database import engine, Base

# Create tables for phase 1 (in production, use Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend for MPLADS Monitoring & Analytics Platform",
    version="1.0.0"
)

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(data.router, prefix="/api/data", tags=["Data"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(geography.router, prefix="/api/analytics/geography", tags=["Geography"])
app.include_router(intelligence.router, prefix="/api/analytics/intelligence", tags=["Intelligence"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

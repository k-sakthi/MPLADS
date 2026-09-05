from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base

class DataRefreshLog(Base):
    __tablename__ = "data_refresh_logs"
    id = Column(Integer, primary_key=True, index=True)
    report_name = Column(String, index=True)
    status = Column(String) # SUCCESS, ERROR
    records_fetched = Column(Integer, default=0)
    error_message = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AllocatedLimit(Base):
    __tablename__ = "allocated_limits"
    id = Column(Integer, primary_key=True, index=True)
    mp_name = Column(String, index=True)
    state_name = Column(String, index=True)
    constituency = Column(String, index=True)
    house_of_parliament = Column(String)
    allocated_amt = Column(Float)
    raw_data = Column(JSON) # Store full record here
    refresh_log_id = Column(Integer, ForeignKey("data_refresh_logs.id"))

class WorkRecommended(Base):
    __tablename__ = "works_recommended"
    id = Column(Integer, primary_key=True, index=True)
    mp_name = Column(String, index=True)
    state_name = Column(String, index=True)
    constituency = Column(String, index=True)
    work_category = Column(String)
    recommended_amount = Column(Float, nullable=True)
    raw_data = Column(JSON)
    refresh_log_id = Column(Integer, ForeignKey("data_refresh_logs.id"))

class WorkSanctioned(Base):
    __tablename__ = "works_sanctioned"
    id = Column(Integer, primary_key=True, index=True)
    mp_name = Column(String, index=True)
    state_name = Column(String, index=True)
    constituency = Column(String, index=True)
    sanction_amount = Column(Float, nullable=True)
    work_stage = Column(String)
    raw_data = Column(JSON)
    refresh_log_id = Column(Integer, ForeignKey("data_refresh_logs.id"))

class WorkCompleted(Base):
    __tablename__ = "works_completed"
    id = Column(Integer, primary_key=True, index=True)
    mp_name = Column(String, index=True)
    state_name = Column(String, index=True)
    constituency = Column(String, index=True)
    actual_amount = Column(Float, nullable=True)
    work_id = Column(String, index=True, nullable=True)
    raw_data = Column(JSON)
    refresh_log_id = Column(Integer, ForeignKey("data_refresh_logs.id"))

class Expenditure(Base):
    __tablename__ = "expenditures"
    id = Column(Integer, primary_key=True, index=True)
    mp_name = Column(String, index=True)
    state_name = Column(String, index=True)
    constituency = Column(String, index=True)
    fund_disbursed_amt = Column(Float, nullable=True)
    vendor_name = Column(String, nullable=True)
    work_id = Column(String, index=True, nullable=True)
    raw_data = Column(JSON)
    refresh_log_id = Column(Integer, ForeignKey("data_refresh_logs.id"))

class CalamityConsent(Base):
    __tablename__ = "calamity_consents"
    id = Column(Integer, primary_key=True, index=True)
    mp_name = Column(String, index=True)
    calamity_name = Column(String)
    consented_amount = Column(Float, nullable=True)
    raw_data = Column(JSON)
    refresh_log_id = Column(Integer, ForeignKey("data_refresh_logs.id"))

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    fingerprint = Column(String, unique=True, index=True) # Hash to prevent duplicates
    alert_type = Column(String, index=True) # HIGH_ANOMALY, LOW_UTILIZATION, HIGH_UTILIZATION, LARGE_VALUE, EXECUTION_DELAY
    priority = Column(String, index=True) # HIGH, MEDIUM, LOW, INFO
    entity_type = Column(String) # MP, STATE, WORK
    entity_name = Column(String, index=True)
    state_name = Column(String, index=True, nullable=True)
    constituency = Column(String, nullable=True)
    metric_name = Column(String, nullable=True)
    observed_value = Column(Float, nullable=True)
    reference_value = Column(Float, nullable=True)
    description = Column(String)
    status = Column(String, default="OPEN", index=True) # OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
    detected_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditException(Base):
    __tablename__ = 'audit_exceptions'
    id = Column(Integer, primary_key=True, index=True)
    fingerprint = Column(String, unique=True, index=True)
    work_id = Column(String, nullable=True)
    entity_type = Column(String, index=True)
    entity_name = Column(String, index=True, nullable=True)
    state_name = Column(String, index=True, nullable=True)
    constituency = Column(String, index=True, nullable=True)
    exception_category = Column(String, index=True)
    exception_type = Column(String, index=True)
    severity = Column(String, index=True)
    explanation = Column(String)
    detected_at = Column(DateTime(timezone=True), index=True, server_default=func.now())
    status = Column(String, index=True, default='OPEN')

class ReportHistory(Base):
    __tablename__ = 'report_history'
    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String, index=True)
    filters = Column(String) # JSON encoded dict
    status = Column(String, default="COMPLETED")
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

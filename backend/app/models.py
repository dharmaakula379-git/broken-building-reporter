from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class Building(Base):
    __tablename__ = "buildings"
    id = Column(Integer, primary_key=True, index=True)
    building_code = Column(String, unique=True, index=True)
    address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    risk = Column(String, default="Low")  # High, Medium, Low
    trend = Column(String, default="Stable")  # Increasing, Stable, Decreasing
    created_at = Column(DateTime, default=datetime.utcnow)
    
    reports = relationship("Report", back_populates="building", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=True)
    damage_type = Column(String)  # Wall Crack, Structural Crack, Water Leakage, Exposed Wiring, etc.
    description = Column(Text, default="")
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String)
    
    # AI Analysis Fields
    severity = Column(String, default="Medium")  # High, Medium, Low, Inspection Required
    confidence = Column(Float, default=0.0)
    priority_score = Column(Integer, default=0)
    recommendation = Column(Text, default="")
    detections_json = Column(Text, default="[]")  # Bounding boxes & labels
    
    # Workflow & Status
    status = Column(String, default="Reported")  # Reported, AI Verified, Inspection Required, Assigned, Under Inspection, Repair Pending, Resolved, Escalated
    assigned_dept = Column(String, nullable=True)  # Building Safety Dept., Engineering Dept., Town Planning Dept., Electrical Dept.
    assigned_inspector = Column(String, nullable=True)
    
    # Escalation & SLA
    sla_hours = Column(Integer, default=48)
    is_escalated = Column(Boolean, default=False)
    escalation_level = Column(Integer, default=0)  # 0: None, 1: Ward, 2: Dept Head, 3: Commissioner, 4: State
    escalation_reason = Column(String, nullable=True)
    
    # Media paths
    image_path = Column(String, nullable=True)
    annotated_image_path = Column(String, nullable=True)
    repair_image_path = Column(String, nullable=True)
    repair_notes = Column(Text, nullable=True)
    repair_verified = Column(Boolean, default=False)
    citizen_email = Column(String, default="rajesh.citizen@gmail.com")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    building = relationship("Building", back_populates="reports")
    audits = relationship("AuditLog", back_populates="report", cascade="all, delete-orphan")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    message = Column(String)
    tone = Column(String, default="info")  # danger, warning, success, info
    link = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    recipient_email = Column(String, default="rajesh.citizen@gmail.com")
    email_sent = Column(Boolean, default=True)
    email_subject = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    action = Column(String)
    actor_role = Column(String, default="System")  # Citizen, Authority, Inspector, AI System
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    report = relationship("Report", back_populates="audits")

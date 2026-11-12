from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ReportCreate(BaseModel):
    damage_type: str
    description: str = ""
    latitude: float
    longitude: float
    address: str
    citizen_email: Optional[str] = "rajesh.citizen@gmail.com"

class DuplicateCheck(BaseModel):
    latitude: float
    longitude: float
    damage_type: str
    threshold_meters: Optional[float] = 120.0

class StatusUpdate(BaseModel):
    status: str
    assigned_dept: Optional[str] = None
    assigned_inspector: Optional[str] = None
    notes: Optional[str] = ""

class EscalationAction(BaseModel):
    report_id: int
    level: int = 1
    reason: str

class RepairVerificationSubmit(BaseModel):
    report_id: int
    notes: str = ""

class NotificationUpdate(BaseModel):
    is_read: bool = True

class EmailSettingsUpdate(BaseModel):
    enabled: bool = True
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    use_tls: bool = True
    sender_name: str = "Vijayawada Civic Safety & Structural Damage Reporter"
    smtp_user: Optional[str] = ""
    smtp_password: Optional[str] = ""
    default_citizen_email: str = "rajesh.citizen@gmail.com"
    default_authority_email: str = "k.ramesh.safety@vijayawada.gov.in"
    admin_alert_email: str = "commissioner.vmc@ap.gov.in"

class TestEmailRequest(BaseModel):
    to_email: str
    subject: Optional[str] = "🔔 Test Notification from Broken Building Reporter"
    message: Optional[str] = "This is a live test notification from your Broken Building Reporter platform in Vijayawada."

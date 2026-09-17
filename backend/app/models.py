from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class Building(Base):
    __tablename__="buildings"
    id=Column(Integer,primary_key=True)
    building_code=Column(String,unique=True,index=True)
    address=Column(String)
    latitude=Column(Float)
    longitude=Column(Float)
    risk=Column(String,default="Low")
    trend=Column(String,default="Stable")
    reports=relationship("Report",back_populates="building")

class Report(Base):
    __tablename__="reports"
    id=Column(Integer,primary_key=True)
    code=Column(String,unique=True,index=True)
    building_id=Column(Integer,ForeignKey("buildings.id"))
    damage_type=Column(String)
    description=Column(Text)
    latitude=Column(Float)
    longitude=Column(Float)
    address=Column(String)
    severity=Column(String,default="Medium")
    confidence=Column(Float,default=0)
    priority_score=Column(Integer,default=0)
    status=Column(String,default="Reported")
    image_path=Column(String,nullable=True)
    created_at=Column(DateTime,default=datetime.utcnow)
    updated_at=Column(DateTime,default=datetime.utcnow,onupdate=datetime.utcnow)
    building=relationship("Building",back_populates="reports")

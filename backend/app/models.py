from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

def utcnow():
    return datetime.now(timezone.utc)

class TrafficReading(Base):
    __tablename__ = "traffic_readings"
    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(String(40), index=True, nullable=False)
    segment_name = Column(String(120), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    vehicle_count = Column(Integer, nullable=False)
    average_speed = Column(Float, nullable=False)
    congestion = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), default=utcnow, index=True)

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(160), nullable=False)
    description = Column(String(700), default="")
    incident_type = Column(String(40), nullable=False)
    severity = Column(String(20), nullable=False, default="Medium")
    status = Column(String(24), nullable=False, default="Reported")
    location = Column(String(160), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    assigned_to = Column(String(100), default="Unassigned")
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

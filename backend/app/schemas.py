from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class IncidentCreate(BaseModel):
    title: str = Field(min_length=4, max_length=160)
    description: str = Field(default="", max_length=700)
    incident_type: str
    severity: str = "Medium"
    location: str = Field(min_length=2, max_length=160)
    latitude: float
    longitude: float
    assigned_to: str = "Unassigned"

class IncidentUpdate(BaseModel):
    status: str | None = None
    severity: str | None = None
    assigned_to: str | None = None
    description: str | None = None

class IncidentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    incident_type: str
    severity: str
    status: str
    location: str
    latitude: float
    longitude: float
    assigned_to: str
    created_at: datetime
    updated_at: datetime

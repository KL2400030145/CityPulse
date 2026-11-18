from sqlalchemy.orm import Session
from .models import TrafficReading, Incident

SEGMENTS = [
    ("S1", "Benz Circle", 16.5062, 80.6480),
    ("S2", "MG Road", 16.5193, 80.6305),
    ("S3", "Governorpet", 16.5170, 80.6260),
    ("S4", "Auto Nagar", 16.4975, 80.6660),
    ("S5", "Kanuru Junction", 16.4850, 80.6900),
    ("S6", "Bhavanipuram", 16.5350, 80.6010),
    ("S7", "Ramavarappadu", 16.5175, 80.6780),
]
# Keep coordinates explicit and editable; all are illustrative demo points.
SEGMENTS[-1] = ("S7", "Ramavarappadu", 16.5175, 80.6780)

def seed_database(db: Session):
    if db.query(TrafficReading).count() == 0:
        for sid, name, lat, lon in SEGMENTS:
            db.add(TrafficReading(segment_id=sid, segment_name=name, latitude=lat, longitude=lon,
                                  vehicle_count=32, average_speed=34.0, congestion=42.0))
    if db.query(Incident).count() == 0:
        samples = [
            Incident(title="Signal outage reported", description="Traffic signal is not responding; field check requested.",
                     incident_type="Signal Failure", severity="High", status="Assigned", location="Benz Circle",
                     latitude=16.5062, longitude=80.6480, assigned_to="Signal Response Team"),
            Incident(title="Road obstruction", description="Temporary obstruction affecting one lane.",
                     incident_type="Road Obstruction", severity="Medium", status="In Progress", location="MG Road",
                     latitude=16.5193, longitude=80.6305, assigned_to="Road Operations"),
            Incident(title="Minor collision", description="Two vehicles reported; no injuries reported in this demo record.",
                     incident_type="Accident", severity="Low", status="Resolved", location="Kanuru Junction",
                     latitude=16.4850, longitude=80.6900, assigned_to="Traffic Patrol"),
        ]
        db.add_all(samples)
    db.commit()

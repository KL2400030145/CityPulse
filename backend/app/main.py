
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Query
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import Base, engine, get_db, SessionLocal
from .models import TrafficReading, Incident
from .schemas import IncidentCreate, IncidentUpdate, IncidentOut
from .seed import seed_database
from .simulator import simulator


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    await simulator.start()

    yield

    await simulator.stop()


app = FastAPI(
    title="CityPulse API",
    version="1.0.0",
    description="Smart-city traffic monitoring and incident operations demo.",
    lifespan=lifespan
)


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://city-pulse-lyart-pi.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "CityPulse API",
        "simulation": simulator.running
    }


@app.get("/api/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    latest = (
        db.query(TrafficReading)
        .order_by(TrafficReading.recorded_at.desc())
        .limit(40)
        .all()
    )

    incidents = db.query(Incident).all()

    if not latest:
        return {
            "vehicles_per_minute": 0,
            "average_speed": 0,
            "congestion": 0,
            "active_incidents": 0
        }

    return {
        "vehicles_per_minute": sum(x.vehicle_count for x in latest),
        "average_speed": round(
            sum(x.average_speed for x in latest) / len(latest), 1
        ),
        "congestion": round(
            sum(x.congestion for x in latest) / len(latest), 1
        ),
        "active_incidents": sum(
            1 for x in incidents
            if x.status not in ("Resolved", "Closed")
        ),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


@app.get("/api/traffic/segments")
def traffic_segments(db: Session = Depends(get_db)):
    rows = (
        db.query(TrafficReading)
        .order_by(TrafficReading.recorded_at.desc())
        .limit(300)
        .all()
    )

    latest = {}

    for row in rows:
        if row.segment_id not in latest:
            latest[row.segment_id] = row

    return [
        {
            "segment_id": r.segment_id,
            "segment_name": r.segment_name,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "vehicle_count": r.vehicle_count,
            "average_speed": r.average_speed,
            "congestion": r.congestion,
            "recorded_at": r.recorded_at.isoformat()
        }
        for r in latest.values()
    ]


@app.get("/api/traffic/history")
def traffic_history(
    limit: int = Query(default=30, ge=1, le=200),
    db: Session = Depends(get_db)
):
    rows = (
        db.query(TrafficReading)
        .order_by(TrafficReading.recorded_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "segment_name": r.segment_name,
            "vehicle_count": r.vehicle_count,
            "average_speed": r.average_speed,
            "congestion": r.congestion,
            "recorded_at": r.recorded_at.isoformat()
        }
        for r in reversed(rows)
    ]


@app.get("/api/incidents", response_model=list[IncidentOut])
def list_incidents(
    status: str | None = None,
    severity: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db)
):
    q = db.query(Incident)

    if status and status != "All":
        q = q.filter(Incident.status == status)

    if severity and severity != "All":
        q = q.filter(Incident.severity == severity)

    if search:
        q = q.filter(
            (Incident.title.ilike(f"%{search}%")) |
            (Incident.location.ilike(f"%{search}%"))
        )

    return q.order_by(Incident.created_at.desc()).all()


@app.post("/api/incidents", response_model=IncidentOut, status_code=201)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db)
):
    allowed_severity = {"Low", "Medium", "High", "Critical"}

    allowed_types = {
        "Accident",
        "Signal Failure",
        "Road Obstruction",
        "Road Closure",
        "Other"
    }

    if payload.severity not in allowed_severity:
        raise HTTPException(400, "Invalid severity")

    if payload.incident_type not in allowed_types:
        raise HTTPException(400, "Invalid incident type")

    item = Incident(**payload.model_dump())

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@app.patch("/api/incidents/{incident_id}", response_model=IncidentOut)
def update_incident(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db)
):
    item = db.get(Incident, incident_id)

    if not item:
        raise HTTPException(404, "Incident not found")

    changes = payload.model_dump(exclude_unset=True)

    if (
        "status" in changes
        and changes["status"] not in {
            "Reported", "Assigned", "In Progress", "Resolved", "Closed"
        }
    ):
        raise HTTPException(400, "Invalid status")

    if (
        "severity" in changes
        and changes["severity"] not in {"Low", "Medium", "High", "Critical"}
    ):
        raise HTTPException(400, "Invalid severity")

    for key, value in changes.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item


@app.get("/api/analytics/hourly")
def hourly_analytics(db: Session = Depends(get_db)):
    rows = (
        db.query(TrafficReading)
        .order_by(TrafficReading.recorded_at.desc())
        .limit(240)
        .all()
    )

    buckets = {}

    for r in rows:
        key = r.recorded_at.strftime("%H:00")

        b = buckets.setdefault(
            key,
            {
                "hour": key,
                "vehicles": 0,
                "speed_total": 0,
                "count": 0
            }
        )

        b["vehicles"] += r.vehicle_count
        b["speed_total"] += r.average_speed
        b["count"] += 1

    return [
        {
            "hour": v["hour"],
            "vehicles": v["vehicles"],
            "average_speed": round(
                v["speed_total"] / v["count"], 1
            )
        }
        for v in list(buckets.values())[::-1]
    ]


@app.post("/api/simulation/start")
async def start_simulation():
    await simulator.start()
    return {"running": True}


@app.post("/api/simulation/stop")
async def stop_simulation():
    await simulator.stop()
    return {"running": False}


@app.websocket("/ws/traffic")
async def traffic_socket(websocket: WebSocket):
    await simulator.connect(websocket)

    try:
        await websocket.send_json({
            "type": "connected",
            "message": "Live traffic stream connected"
        })

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        simulator.disconnect(websocket)

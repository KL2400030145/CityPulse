# CityPulse — Smart City Traffic & Mobility Platform

A practical full-stack smart-city traffic operations demo. CityPulse combines a live operations dashboard, simulated traffic telemetry, incident management, corridor analytics, and a map-based view.

> **Honest demo note:** The included traffic stream is generated locally by a simulator. It is not connected to real city cameras, GPS devices, or government traffic feeds. The map uses OpenStreetMap tiles and illustrative seeded road-segment coordinates around Vijayawada. Replace the simulator and seed data with authorized live feeds before presenting it as a deployed real-world system.

## What is included

- Live dashboard with vehicle flow, average speed, congestion, and active incidents.
- WebSocket telemetry stream with a controllable simulation.
- Map view with color-coded traffic segments and incident markers.
- Incident workflow: create, assign, update status, set severity, and close.
- Corridor analytics with hourly traffic volume and average speed.
- Search and filters for incidents.
- SQLite persistence with SQLAlchemy.
- REST API with Pydantic validation and OpenAPI docs.
- Responsive interface with a clean, readable typography system.
- Docker Compose setup and basic backend tests.

## Architecture

```text
Traffic simulator
      |
      v
FastAPI telemetry service ---- WebSocket ----> React live dashboard
      |
      +---- REST API -------------------------> Incident / analytics UI
      |
      v
SQLite (SQLAlchemy)
```

The architecture is intentionally modular. For a larger deployment, Kafka can replace the in-process event stream, PostgreSQL/PostGIS can replace SQLite, and an authorized GPS/IoT provider can replace the simulator.

## Requirements

- Python 3.10+
- Node.js 20+
- npm
- Optional: Docker Desktop

## Run locally (Windows PowerShell)

### 1. Backend

```powershell
cd CityPulse\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend (open a second terminal)

```powershell
cd CityPulse\frontend
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again.

## Run with Docker

```powershell
cd CityPulse
docker compose up --build
```

Frontend: http://localhost:5173  
Backend docs: http://localhost:8000/docs

## Main API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Service health |
| GET | `/api/dashboard/summary` | Current traffic summary |
| GET | `/api/traffic/segments` | Latest road-segment readings |
| GET | `/api/traffic/history` | Recent telemetry history |
| GET | `/api/incidents` | List/search/filter incidents |
| POST | `/api/incidents` | Create incident |
| PATCH | `/api/incidents/{id}` | Update incident |
| GET | `/api/analytics/hourly` | Hourly traffic analytics |
| POST | `/api/simulation/start` | Start local telemetry simulator |
| POST | `/api/simulation/stop` | Stop local telemetry simulator |
| WS | `/ws/traffic` | Live telemetry events |

## Suggested extension work

1. Replace local simulation with a verified GPS/IoT data source.
2. Add PostgreSQL + PostGIS and geospatial queries.
3. Add Kafka topics and consumer groups for high-volume telemetry.
4. Add authentication and role-based access for operators and administrators.
5. Add integration tests, CI, and deployment monitoring.

## Project structure

```text
CityPulse/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── seed.py
│   │   └── simulator.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml
```

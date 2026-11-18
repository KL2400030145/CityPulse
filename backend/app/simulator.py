import asyncio, random
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import TrafficReading
from .seed import SEGMENTS

class TrafficSimulator:
    def __init__(self):
        self.running = False
        self.task = None
        self.clients = set()

    async def connect(self, websocket):
        await websocket.accept()
        self.clients.add(websocket)

    def disconnect(self, websocket):
        self.clients.discard(websocket)

    async def broadcast(self, payload):
        dead = []
        for client in list(self.clients):
            try:
                await client.send_json(payload)
            except Exception:
                dead.append(client)
        for client in dead:
            self.disconnect(client)

    async def start(self):
        if self.running:
            return
        self.running = True
        self.task = asyncio.create_task(self._loop())

    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task = None

    async def _loop(self):
        while self.running:
            db: Session = SessionLocal()
            try:
                sid, name, lat, lon = random.choice(SEGMENTS)
                speed = round(max(5, min(65, random.gauss(31, 12))), 1)
                count = random.randint(12, 105)
                congestion = round(max(0, min(100, (1 - speed / 70) * 100 + random.uniform(-8, 8))), 1)
                reading = TrafficReading(segment_id=sid, segment_name=name, latitude=lat, longitude=lon,
                                          vehicle_count=count, average_speed=speed, congestion=congestion,
                                          recorded_at=datetime.now(timezone.utc))
                db.add(reading)
                db.commit()
                await self.broadcast({
                    "type": "traffic_update", "segment_id": sid, "segment_name": name,
                    "latitude": lat, "longitude": lon, "vehicle_count": count,
                    "average_speed": speed, "congestion": congestion,
                    "recorded_at": reading.recorded_at.isoformat()
                })
            finally:
                db.close()
            await asyncio.sleep(2.5)

simulator = TrafficSimulator()

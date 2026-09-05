"""Route ORM Model for SQLite persistence."""
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Float, Integer, JSON, DateTime
from datetime import datetime
from .database import Base


class RouteORM(Base):
    __tablename__ = "routes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    origin_port = Column(String, nullable=False)
    destination_port = Column(String, nullable=False)
    distance_nm = Column(Float, nullable=False)
    avg_weather_severity = Column(Float, nullable=False, default=2.0)
    seca_distance_pct = Column(Float, nullable=False, default=0.0)
    waypoints = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "origin_port": self.origin_port,
            "destination_port": self.destination_port,
            "distance_nm": self.distance_nm,
            "avg_weather_severity": self.avg_weather_severity,
            "seca_distance_pct": self.seca_distance_pct,
            "waypoints": self.waypoints or [],
        }

"""Prediction History ORM Model for SQLite persistence."""
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Float, Integer, JSON, DateTime
from datetime import datetime
from .database import Base


class PredictionHistoryORM(Base):
    __tablename__ = "prediction_history"

    id = Column(String, primary_key=True, index=True)
    vessel_id = Column(String, nullable=False, index=True)
    vessel_name = Column(String, nullable=False)
    speed_knots = Column(Float, nullable=False)
    draft_meters = Column(Float, nullable=False)
    cargo_load_pct = Column(Float, nullable=False)
    fuel_type = Column(String, nullable=False)
    weather_severity = Column(Float, nullable=False)
    distance_nm = Column(Float, nullable=False)
    route_name = Column(String, nullable=True)

    predicted_fuel_mt = Column(Float, nullable=False)
    predicted_cost_usd = Column(Float, nullable=False)
    co2_emissions_mt = Column(Float, nullable=False)
    cii_score = Column(Float, nullable=False)
    cii_rating = Column(String, nullable=False)
    breakdown = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "vessel_id": self.vessel_id,
            "vessel_name": self.vessel_name,
            "speed_knots": self.speed_knots,
            "draft_meters": self.draft_meters,
            "cargo_load_pct": self.cargo_load_pct,
            "fuel_type": self.fuel_type,
            "weather_severity": self.weather_severity,
            "distance_nm": self.distance_nm,
            "route_name": self.route_name,
            "predicted_fuel_mt": self.predicted_fuel_mt,
            "predicted_cost_usd": self.predicted_cost_usd,
            "co2_emissions_mt": self.co2_emissions_mt,
            "cii_score": self.cii_score,
            "cii_rating": self.cii_rating,
            "breakdown": self.breakdown,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

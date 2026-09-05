"""Vessel ORM Model for SQLite persistence."""
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Float, Integer, JSON, DateTime
from datetime import datetime
from .database import Base


class VesselORM(Base):
    __tablename__ = "vessels"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    vessel_type = Column(String, nullable=False)
    capacity_teu = Column(Integer, nullable=False)
    deadweight_tonnage = Column(Float, nullable=False)
    design_speed_knots = Column(Float, nullable=False)
    min_speed_knots = Column(Float, nullable=False, default=8.0)
    max_speed_knots = Column(Float, nullable=False, default=24.0)
    fuel_type = Column(String, nullable=False)
    supported_fuels = Column(JSON, nullable=True)  # List of fuel names
    cii_rating = Column(String, nullable=False, default="C")
    base_consumption_rate = Column(Float, nullable=False)
    auxiliary_consumption = Column(Float, nullable=False, default=3.0)
    boiler_consumption = Column(Float, nullable=False, default=1.5)
    operational_status = Column(String, nullable=False, default="Active")
    current_location = Column(String, nullable=True, default="At Sea")
    assigned_route = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "vessel_type": self.vessel_type,
            "capacity_teu": self.capacity_teu,
            "deadweight_tonnage": self.deadweight_tonnage,
            "design_speed_knots": self.design_speed_knots,
            "min_speed_knots": self.min_speed_knots,
            "max_speed_knots": self.max_speed_knots,
            "fuel_type": self.fuel_type,
            "supported_fuels": self.supported_fuels or [self.fuel_type],
            "cii_rating": self.cii_rating,
            "base_consumption_rate": self.base_consumption_rate,
            "auxiliary_consumption": self.auxiliary_consumption,
            "boiler_consumption": self.boiler_consumption,
            "operational_status": self.operational_status,
            "current_location": self.current_location,
            "assigned_route": self.assigned_route,
        }

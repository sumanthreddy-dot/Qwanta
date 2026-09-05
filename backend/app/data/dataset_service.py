"""Dataset Repositories and Service Layer for GreenQ Fleet Data.

Provides high-performance in-memory indexing, filtering, statistical aggregation,
and constraint repair for:
- `GreenQ_FleetOptimization_Scenarios.csv` (1,467 operational scenarios)
- `GreenQ_Fleet_ALL_IN_ONE.csv` (81,342 telemetry records)
"""
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import pandas as pd
import numpy as np

from .dataset_models import (
    FleetOptimizationScenario,
    ScenarioQueryFilter,
    ScenarioSummaryResponse,
    FleetTelemetryRecord,
    TelemetryQueryFilter,
    TelemetryStatsResponse,
)
from .dataset_features import repair_infeasible_constraints, extract_ml_feature_vector


class FleetScenariosRepository:
    """Repository providing indexed search and aggregation over GreenQ_FleetOptimization_Scenarios.csv."""

    def __init__(self, csv_path: Optional[str] = None):
        if csv_path is None:
            # Fallback path checking root data/ or external download paths
            base = Path(__file__).resolve().parent.parent.parent.parent
            local_path = base / "data" / "GreenQ_FleetOptimization_Scenarios.csv"
            ext_path = Path("D:/Downloads/GreenQ_FleetOptimization_Scenarios.csv")
            csv_path = str(local_path if local_path.exists() else ext_path)

        self.csv_path = Path(csv_path)
        if not self.csv_path.exists():
            raise FileNotFoundError(f"Scenarios dataset not found at: {self.csv_path}")

        self.df = pd.read_csv(self.csv_path)
        self._build_indexes()

    def _build_indexes(self):
        """Index unique categorical attributes for O(1) facet lookups."""
        self.routes = sorted(self.df["route_id"].unique().tolist())
        self.vessel_types = sorted(self.df["candidate_vessel_type"].unique().tolist())
        self.fuel_types = sorted(self.df["candidate_fuel_type"].unique().tolist())
        self.weather_scenarios = sorted(self.df["weather_scenario"].unique().tolist())
        self.valid_counts = self.df["candidate_valid"].value_counts().to_dict()

    def query(self, filters: ScenarioQueryFilter) -> Tuple[List[Dict[str, Any]], int]:
        """Filter scenarios matching criteria with pagination. Returns (records, total_matching)."""
        filtered = self.df

        if filters.route_id:
            filtered = filtered[filtered["route_id"] == filters.route_id]
        if filters.origin_port:
            filtered = filtered[filtered["origin_port"] == filters.origin_port]
        if filters.destination_port:
            filtered = filtered[filtered["destination_port"] == filters.destination_port]
        if filters.weather_scenario:
            filtered = filtered[filtered["weather_scenario"] == filters.weather_scenario]
        if filters.candidate_vessel_type:
            filtered = filtered[filtered["candidate_vessel_type"] == filters.candidate_vessel_type]
        if filters.candidate_fuel_type:
            filtered = filtered[filtered["candidate_fuel_type"] == filters.candidate_fuel_type]
        if filters.min_speed_knots is not None:
            filtered = filtered[filtered["candidate_speed_knots"] >= filters.min_speed_knots]
        if filters.max_speed_knots is not None:
            filtered = filtered[filtered["candidate_speed_knots"] <= filters.max_speed_knots]
        if filters.candidate_valid is not None:
            filtered = filtered[filtered["candidate_valid"] == filters.candidate_valid]

        total_matching = len(filtered)
        paged = filtered.iloc[filters.offset : filters.offset + filters.limit]
        return paged.to_dict(orient="records"), total_matching

    def get_by_id(self, scenario_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single scenario by its ID."""
        matched = self.df[self.df["scenario_id"] == scenario_id]
        if matched.empty:
            return None
        return matched.iloc[0].to_dict()

    def get_summary(self) -> ScenarioSummaryResponse:
        """Compute aggregated statistical summary of the scenarios dataset."""
        valid_df = self.df[self.df["candidate_valid"] == 1]

        return ScenarioSummaryResponse(
            total_scenarios=len(self.df),
            valid_scenarios_count=int(self.df["candidate_valid"].sum()),
            invalid_scenarios_count=int(len(self.df) - self.df["candidate_valid"].sum()),
            routes_breakdown=self.df["route_id"].value_counts().to_dict(),
            vessel_types_breakdown=self.df["candidate_vessel_type"].value_counts().to_dict(),
            fuel_types_breakdown=self.df["candidate_fuel_type"].value_counts().to_dict(),
            weather_scenarios_breakdown=self.df["weather_scenario"].value_counts().to_dict(),
            avg_fuel_litres_valid=round(float(valid_df["total_fuel_litres"].mean()), 2) if not valid_df.empty else 0.0,
            avg_fuel_cost_usd_valid=round(float(valid_df["total_fuel_cost_usd"].mean()), 2) if not valid_df.empty else 0.0,
            avg_co2_kg_valid=round(float(valid_df["total_co2_kg"].mean()), 2) if not valid_df.empty else 0.0,
            avg_voyage_hours_valid=round(float(valid_df["voyage_duration_hours"].mean()), 2) if not valid_df.empty else 0.0,
        )


class FleetTelemetryRepository:
    """Repository providing high-throughput querying and analytics over GreenQ_Fleet_ALL_IN_ONE.csv."""

    def __init__(self, csv_path: Optional[str] = None):
        if csv_path is None:
            base = Path(__file__).resolve().parent.parent.parent.parent
            local_path = base / "data" / "GreenQ_Fleet_ALL_IN_ONE.csv"
            ext_path = Path("D:/Desktop/GreenQ_Fleet_ALL_IN_ONE.csv")
            csv_path = str(local_path if local_path.exists() else ext_path)

        self.csv_path = Path(csv_path)
        if not self.csv_path.exists():
            raise FileNotFoundError(f"Telemetry dataset not found at: {self.csv_path}")

        # Load DataFrame with optimized types
        self.df = pd.read_csv(self.csv_path)

    def query(self, filters: TelemetryQueryFilter) -> Tuple[List[Dict[str, Any]], int]:
        """Query telemetry records with filtering and pagination."""
        filtered = self.df

        if filters.voyage_id:
            filtered = filtered[filtered["voyage_id"] == filters.voyage_id]
        if filters.weather_scenario:
            filtered = filtered[filtered["weather_scenario"] == filters.weather_scenario]
        if filters.fuel_type:
            filtered = filtered[filtered["fuel_type"] == filters.fuel_type]
        if filters.constraint_status:
            filtered = filtered[filtered["constraint_status"] == filters.constraint_status]
        if filters.delivery_feasible is not None:
            filtered = filtered[filtered["delivery_feasible"] == filters.delivery_feasible]
        if filters.min_speed_knots is not None:
            filtered = filtered[filtered["speed_decision_knots"] >= filters.min_speed_knots]
        if filters.max_speed_knots is not None:
            filtered = filtered[filtered["speed_decision_knots"] <= filters.max_speed_knots]

        total_matching = len(filtered)
        paged = filtered.iloc[filters.offset : filters.offset + filters.limit]
        return paged.to_dict(orient="records"), total_matching

    def get_stats(self) -> TelemetryStatsResponse:
        """Compute summary statistics across all 81,342 telemetry records."""
        feasible = int((self.df["delivery_feasible"] == 1).sum())
        needs_repair = int((self.df["constraint_status"] == "needs_repair").sum())

        return TelemetryStatsResponse(
            total_records=len(self.df),
            feasible_count=feasible,
            needs_repair_count=needs_repair,
            mean_speed_sog_kn=round(float(self.df["Speed over ground (kn)"].mean()), 4),
            mean_speed_stw_kn=round(float(self.df["Speed through water (kn)"].mean()), 4),
            mean_fuel_consumption_lph=round(float(self.df["Main engine consumption (L/hr)"].mean()), 2),
            mean_shaft_power_kw=round(float(self.df["Main engine shaft power (KW)"].mean()), 2),
            mean_wave_height_m=round(float(self.df["Wave height (m)"].mean()), 4),
            mean_wind_speed_mps=round(float(self.df["Wind speed (m/s)"].mean()), 4),
            mean_mean_draft_m=round(float(self.df["Mean draft (m)"].mean()), 4),
            weather_breakdown=self.df["weather_scenario"].value_counts().to_dict(),
            fuel_breakdown=self.df["fuel_type"].value_counts().to_dict(),
            constraint_breakdown=self.df["constraint_status"].value_counts().to_dict(),
        )

    def get_downsampled_time_series(self, sample_size: int = 100) -> List[Dict[str, Any]]:
        """Downsample the 81,342 time series into representative points for responsive charts."""
        step = max(1, len(self.df) // sample_size)
        sampled = self.df.iloc[::step].head(sample_size)
        cols = [
            "timestamp_synthetic",
            "Speed over ground (kn)",
            "Speed through water (kn)",
            "Main engine consumption (L/hr)",
            "Main engine shaft power (KW)",
            "Wave height (m)",
            "Wind speed (m/s)",
            "fuel_type",
            "constraint_status"
        ]
        return sampled[cols].to_dict(orient="records")


class DatasetService:
    """Singleton service providing coordinated access to both fleet datasets."""

    _instance: Optional["DatasetService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatasetService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return

        self.scenarios_repo = FleetScenariosRepository()
        self.telemetry_repo = FleetTelemetryRepository()
        self._initialized = True

    def repair_scenario(self, scenario_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Apply constraint repair logic to an infeasible operational scenario."""
        return repair_infeasible_constraints(scenario_dict)

    def extract_features(self, record_dict: Dict[str, Any]) -> List[float]:
        """Extract a standardized ML numerical feature vector."""
        vec = extract_ml_feature_vector(record_dict)
        return vec.tolist()


# Global singleton instance
dataset_service = DatasetService()

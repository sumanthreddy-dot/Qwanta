"""Data models wrapping all attributes of GreenQ Fleet Datasets.

Covers:
1. `GreenQ_FleetOptimization_Scenarios.csv` (1,467 operational scenarios, 20 attributes)
2. `GreenQ_Fleet_ALL_IN_ONE.csv` (81,342 telemetry records, 83 attributes)
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


# ============================================================================
# 1. SCENARIOS DATASET MODELS (GreenQ_FleetOptimization_Scenarios.csv)
# ============================================================================

class FleetOptimizationScenario(BaseModel):
    """Complete representation of a record from GreenQ_FleetOptimization_Scenarios.csv (20 attributes)."""
    model_config = ConfigDict(populate_by_name=True)

    scenario_id: str = Field(..., description="Unique scenario identifier (e.g. SCN_0001)")
    route_id: str = Field(..., description="Corridor ID (e.g. R1_Mormugao_Rotterdam)")
    origin_port: str = Field(..., description="Departure port (e.g. Mormugao_IN)")
    destination_port: str = Field(..., description="Arrival port (e.g. Rotterdam_NL)")
    distance_nm: float = Field(..., description="Route corridor distance in nautical miles")
    weather_scenario: str = Field(..., description="Sea condition (normal, moderate_weather, bad_weather, high_wave_wind)")
    cargo_demand_tonnes: float = Field(..., description="Payload demand to transport in metric tonnes")
    deadline_hours: float = Field(..., description="Transit deadline constraint in hours")
    candidate_vessel_type: str = Field(..., description="Assigned vessel class (e.g. Kamsarmax Bulk Carrier)")
    vessel_capacity_tonnes: float = Field(..., description="Deadweight vessel capacity in tonnes")
    candidate_fuel_type: str = Field(..., description="Propulsion bunker fuel (conventional, lng, methanol, ammonia, hydrogen)")
    candidate_speed_knots: float = Field(..., description="Operating cruising speed in knots")
    shaft_power_kw: float = Field(..., description="Main engine shaft power requirement in kW")
    voyage_duration_hours: float = Field(..., description="Calculated transit duration in hours")
    total_fuel_litres: float = Field(..., description="Total fuel consumption across transit in litres")
    total_fuel_cost_usd: float = Field(..., description="Total bunker cost in USD")
    total_co2_kg: float = Field(..., description="Total Well-to-Wake CO2 equivalent emissions in kg")
    cargo_capacity_sufficient: int = Field(..., description="Binary flag (1 = capacity >= demand, 0 = shortfall)")
    schedule_feasible: int = Field(..., description="Binary flag (1 = voyage_hours <= deadline, 0 = deadline exceeded)")
    candidate_valid: int = Field(..., description="Binary flag (1 = meets all constraints, 0 = infeasible)")


class ScenarioQueryFilter(BaseModel):
    """Query filters for searching the 1,467 fleet optimization scenarios."""
    route_id: Optional[str] = None
    origin_port: Optional[str] = None
    destination_port: Optional[str] = None
    weather_scenario: Optional[str] = None
    candidate_vessel_type: Optional[str] = None
    candidate_fuel_type: Optional[str] = None
    min_speed_knots: Optional[float] = None
    max_speed_knots: Optional[float] = None
    candidate_valid: Optional[int] = None
    limit: int = Field(50, ge=1, le=500)
    offset: int = Field(0, ge=0)


class ScenarioSummaryResponse(BaseModel):
    """Aggregated statistical summary of the scenarios dataset."""
    total_scenarios: int
    valid_scenarios_count: int
    invalid_scenarios_count: int
    routes_breakdown: Dict[str, int]
    vessel_types_breakdown: Dict[str, int]
    fuel_types_breakdown: Dict[str, int]
    weather_scenarios_breakdown: Dict[str, int]
    avg_fuel_litres_valid: float
    avg_fuel_cost_usd_valid: float
    avg_co2_kg_valid: float
    avg_voyage_hours_valid: float


# ============================================================================
# 2. TELEMETRY ALL-IN-ONE DATASET MODELS (GreenQ_Fleet_ALL_IN_ONE.csv)
# ============================================================================

class VesselIdentitySpec(BaseModel):
    """Vessel identity and static structural parameters (9 attributes)."""
    vessel_id: str
    voyage_id: str
    timestamp_synthetic: str
    vessel_type: str
    capacity_tonnes: float
    min_speed_knots: float
    max_speed_knots: float
    available: int
    engine_rated_power_kw: float


class RouteCargoSpec(BaseModel):
    """Corridor, port geometry and cargo characteristics (8 attributes)."""
    origin_port: str
    destination_port: str
    distance_nm: float
    cargo_demand_tonnes: float
    cargo_type: str
    deadline_hours: float
    loading_time_hours: float
    unloading_time_hours: float


class FuelInfrastructureSpec(BaseModel):
    """Fuel bunkering and shore-power readiness (5 attributes)."""
    fuel_type: str
    fuel_available: int
    fuel_compatible: int
    shore_power_available: int
    shore_power_compatible: int


class OperationalDecisionsSpec(BaseModel):
    """Decisions, operational flags and scenario multipliers (10 attributes)."""
    weather_scenario: str
    fuel_price_scenario: str
    demand_scenario: str
    selected_vessel: int
    speed_decision_knots: float
    cargo_assigned_tonnes: float
    shore_power_decision: int
    weather_penalty_factor: float
    fuel_price_multiplier: float
    demand_multiplier: float


class NavigationTelemetrySpec(BaseModel):
    """Real-time nautical positioning and navigation sensors (5 attributes)."""
    model_config = ConfigDict(populate_by_name=True)

    speed_over_ground_kn: float = Field(..., alias="Speed over ground (kn)")
    speed_through_water_kn: float = Field(..., alias="Speed through water (kn)")
    course_deg: float = Field(..., alias="Course (Degree)")
    heading_deg: float = Field(..., alias="Heading (Degree)")
    rate_of_turn_deg_min: float = Field(..., alias="Rate of turn (degree/min)")


class PropulsionTelemetrySpec(BaseModel):
    """Engine combustion and shaft mechanics (4 attributes)."""
    model_config = ConfigDict(populate_by_name=True)

    main_engine_consumption_lph: float = Field(..., alias="Main engine consumption (L/hr)")
    main_engine_shaft_rpm: float = Field(..., alias="Main engine shaft RPM")
    main_engine_shaft_power_kw: float = Field(..., alias="Main engine shaft power (KW)")
    main_engine_shaft_torque_knm: float = Field(..., alias="Main engine shaft torque (KNm)")


class HydrodynamicsSpec(BaseModel):
    """Hull trim, water displacement and velocity metrics (6 attributes)."""
    model_config = ConfigDict(populate_by_name=True)

    mean_draft_m: float = Field(..., alias="Mean draft (m)")
    draft_aft_m: float = Field(..., alias="Draft Aft (m)")
    draft_fwd_m: float = Field(..., alias="Draft Fwd (m)")
    draft_difference_m: float
    speed_ratio_sog_stw: float
    speed_cubed_kn3: float


class OceanographicEnvironmentSpec(BaseModel):
    """Meteo-oceanographic conditions and sea state indices (15 attributes)."""
    model_config = ConfigDict(populate_by_name=True)

    wave_height_m: float = Field(..., alias="Wave height (m)")
    wind_speed_mps: float = Field(..., alias="Wind speed (m/s)")
    swell_height_m: float = Field(..., alias="Swell height (m)")
    current_speed_mps: float = Field(..., alias="Current speed (m/s)")
    weather_severity_index: float
    sea_state_index: float
    wind_direction_deg_synthetic: float
    wave_direction_deg_synthetic: float
    swell_direction_deg_synthetic: float
    wave_period_sec_synthetic: float
    swell_period_sec_synthetic: float
    air_temperature_c_synthetic: float
    sea_surface_temperature_c_synthetic: float
    air_pressure_hpa_synthetic: float
    visibility_km_synthetic: float


class MultiFuelEconomicsSpec(BaseModel):
    """Multi-fuel Well-to-Wake pricing and shore power parameters (14 attributes)."""
    conventional_price_per_litre: float
    conventional_wtw_kgco2e_per_litre: float
    lng_price_per_litre: float
    lng_wtw_kgco2e_per_litre: float
    methanol_price_per_litre: float
    methanol_wtw_kgco2e_per_litre: float
    hydrogen_price_per_litre: float
    hydrogen_wtw_kgco2e_per_litre: float
    ammonia_price_per_litre: float
    ammonia_wtw_kgco2e_per_litre: float
    shore_power_hours: float
    shore_power_kwh: float
    electricity_price_per_kwh: float
    shore_power_wtw_kgco2e_per_kwh: float


class ConstraintStatusSpec(BaseModel):
    """Optimization target baselines and constraint feasibility (7 attributes)."""
    estimated_voyage_hours: float
    fuel_consumption_target_lph: float
    reference_fuel_used_litres: float
    reference_fuel_cost: float
    reference_wtw_ghg_kg: float
    delivery_feasible: int
    constraint_status: str


class FleetTelemetryRecord(BaseModel):
    """Comprehensive data wrapper representing all 83 attributes of a record in GreenQ_Fleet_ALL_IN_ONE.csv."""
    model_config = ConfigDict(populate_by_name=True)

    # 1. Identity & Specs (9)
    vessel_id: str
    voyage_id: str
    timestamp_synthetic: str
    vessel_type: str
    capacity_tonnes: float
    min_speed_knots: float
    max_speed_knots: float
    available: int
    engine_rated_power_kw: float

    # 2. Route & Cargo (8)
    origin_port: str
    destination_port: str
    distance_nm: float
    cargo_demand_tonnes: float
    cargo_type: str
    deadline_hours: float
    loading_time_hours: float
    unloading_time_hours: float

    # 3. Fuel & Shore Power Setup (5)
    fuel_type: str
    fuel_available: int
    fuel_compatible: int
    shore_power_available: int
    shore_power_compatible: int

    # 4. Decisions & Multipliers (10)
    weather_scenario: str
    fuel_price_scenario: str
    demand_scenario: str
    selected_vessel: int
    speed_decision_knots: float
    cargo_assigned_tonnes: float
    shore_power_decision: int
    weather_penalty_factor: float
    fuel_price_multiplier: float
    demand_multiplier: float

    # 5. Navigation Telemetry (5)
    speed_over_ground_kn: float = Field(..., alias="Speed over ground (kn)")
    speed_through_water_kn: float = Field(..., alias="Speed through water (kn)")
    course_deg: float = Field(..., alias="Course (Degree)")
    heading_deg: float = Field(..., alias="Heading (Degree)")
    rate_of_turn_deg_min: float = Field(..., alias="Rate of turn (degree/min)")

    # 6. Engine & Propulsion Mechanics (4)
    main_engine_consumption_lph: float = Field(..., alias="Main engine consumption (L/hr)")
    main_engine_shaft_rpm: float = Field(..., alias="Main engine shaft RPM")
    main_engine_shaft_power_kw: float = Field(..., alias="Main engine shaft power (KW)")
    main_engine_shaft_torque_knm: float = Field(..., alias="Main engine shaft torque (KNm)")

    # 7. Draft & Hydrodynamics (6)
    mean_draft_m: float = Field(..., alias="Mean draft (m)")
    draft_aft_m: float = Field(..., alias="Draft Aft (m)")
    draft_fwd_m: float = Field(..., alias="Draft Fwd (m)")
    draft_difference_m: float
    speed_ratio_sog_stw: float
    speed_cubed_kn3: float

    # 8. Oceanographic & Weather Sensors (15)
    wave_height_m: float = Field(..., alias="Wave height (m)")
    wind_speed_mps: float = Field(..., alias="Wind speed (m/s)")
    swell_height_m: float = Field(..., alias="Swell height (m)")
    current_speed_mps: float = Field(..., alias="Current speed (m/s)")
    weather_severity_index: float
    sea_state_index: float
    wind_direction_deg_synthetic: float
    wave_direction_deg_synthetic: float
    swell_direction_deg_synthetic: float
    wave_period_sec_synthetic: float
    swell_period_sec_synthetic: float
    air_temperature_c_synthetic: float
    sea_surface_temperature_c_synthetic: float
    air_pressure_hpa_synthetic: float
    visibility_km_synthetic: float

    # 9. Multi-Fuel Economics & WTW GHG (14)
    conventional_price_per_litre: float
    conventional_wtw_kgco2e_per_litre: float
    lng_price_per_litre: float
    lng_wtw_kgco2e_per_litre: float
    methanol_price_per_litre: float
    methanol_wtw_kgco2e_per_litre: float
    hydrogen_price_per_litre: float
    hydrogen_wtw_kgco2e_per_litre: float
    ammonia_price_per_litre: float
    ammonia_wtw_kgco2e_per_litre: float
    shore_power_hours: float
    shore_power_kwh: float
    electricity_price_per_kwh: float
    shore_power_wtw_kgco2e_per_kwh: float

    # 10. Targets & Constraint Status (7)
    estimated_voyage_hours: float
    fuel_consumption_target_lph: float
    reference_fuel_used_litres: float
    reference_fuel_cost: float
    reference_wtw_ghg_kg: float
    delivery_feasible: int
    constraint_status: str


class TelemetryQueryFilter(BaseModel):
    """Query filters for streaming/paging the 81,342 telemetry records."""
    voyage_id: Optional[str] = None
    weather_scenario: Optional[str] = None
    fuel_type: Optional[str] = None
    constraint_status: Optional[str] = None
    delivery_feasible: Optional[int] = None
    min_speed_knots: Optional[float] = None
    max_speed_knots: Optional[float] = None
    limit: int = Field(50, ge=1, le=500)
    offset: int = Field(0, ge=0)


class TelemetryStatsResponse(BaseModel):
    """Statistical aggregations over the 81,342 telemetry sensor observations."""
    total_records: int
    feasible_count: int
    needs_repair_count: int
    mean_speed_sog_kn: float
    mean_speed_stw_kn: float
    mean_fuel_consumption_lph: float
    mean_shaft_power_kw: float
    mean_wave_height_m: float
    mean_wind_speed_mps: float
    mean_mean_draft_m: float
    weather_breakdown: Dict[str, int]
    fuel_breakdown: Dict[str, int]
    constraint_breakdown: Dict[str, int]

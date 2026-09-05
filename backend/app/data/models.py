"""Domain and Pydantic models for QWANTA Fleet Decision Engine."""
from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class DomainType(str, Enum):
    MARITIME = "maritime"
    ROAD_FREIGHT = "road_freight"


class VesselType(str, Enum):
    CONTAINER = "Container"
    BULK_CARRIER = "Bulk Carrier"
    OIL_TANKER = "Oil Tanker"
    LNG_CARRIER = "LNG Carrier"
    RORO_FERRY = "Ro-Ro Ferry"
    GENERAL_CARGO = "General Cargo"
    HEAVY_TRUCK = "Heavy Duty Truck"


class FuelType(str, Enum):
    CONVENTIONAL = "Conventional"
    HFO = "HFO"              # Heavy Fuel Oil
    MGO = "MGO"              # Marine Gas Oil
    VLSFO = "VLSFO"          # Very Low Sulphur Fuel Oil
    LNG = "LNG"              # Liquefied Natural Gas
    METHANOL = "Methanol"    # Bio/E-Methanol
    HYDROGEN = "Hydrogen"    # Green Hydrogen
    AMMONIA = "Ammonia"      # Green Ammonia
    BIOFUEL = "Biofuel"      # Biodiesel blend
    ELECTRIC = "Electric"    # Hybrid / Battery-assisted


class WeatherCondition(str, Enum):
    CALM = "Calm"
    MODERATE = "Moderate"
    ROUGH = "Rough"
    STORMY = "Stormy"


class FuelSpec(BaseModel):
    name: FuelType
    lhv_mj_per_kg: float = Field(..., description="Lower heating value in MJ/kg")
    density_kg_per_l: float = Field(..., description="Density in kg per litre")
    co2_factor_kg_per_kg: float = Field(..., description="kg CO2 per kg fuel burned")
    co2_factor_kg_per_l: float = Field(..., description="kg CO2 per litre of fuel burned")
    price_usd_per_tonne: float = Field(..., description="Average price in USD per metric tonne")
    price_usd_per_litre: float = Field(..., description="Average price in USD per litre")
    wtw_factor_kg_per_l: float = Field(3.20, description="Well-to-Wake GHG factor in kg CO2e per litre")


# Calibrated fuel specifications based on IMO 4th GHG study and global bunker rates
FUEL_CATALOG: Dict[FuelType, FuelSpec] = {
    FuelType.CONVENTIONAL: FuelSpec(
        name=FuelType.CONVENTIONAL,
        lhv_mj_per_kg=41.2,
        density_kg_per_l=0.890,
        co2_factor_kg_per_kg=3.150,
        co2_factor_kg_per_l=2.803,
        price_usd_per_tonne=680.0,
        price_usd_per_litre=0.605,
        wtw_factor_kg_per_l=3.20
    ),
    FuelType.VLSFO: FuelSpec(
        name=FuelType.VLSFO,
        lhv_mj_per_kg=41.0,
        density_kg_per_l=0.895,
        co2_factor_kg_per_kg=3.151,
        co2_factor_kg_per_l=2.820,
        price_usd_per_tonne=650.0,
        price_usd_per_litre=0.582,
        wtw_factor_kg_per_l=3.20
    ),
    FuelType.HFO: FuelSpec(
        name=FuelType.HFO,
        lhv_mj_per_kg=40.2,
        density_kg_per_l=0.985,
        co2_factor_kg_per_kg=3.114,
        co2_factor_kg_per_l=3.067,
        price_usd_per_tonne=520.0,
        price_usd_per_litre=0.512,
        wtw_factor_kg_per_l=3.35
    ),
    FuelType.MGO: FuelSpec(
        name=FuelType.MGO,
        lhv_mj_per_kg=42.7,
        density_kg_per_l=0.860,
        co2_factor_kg_per_kg=3.206,
        co2_factor_kg_per_l=2.757,
        price_usd_per_tonne=780.0,
        price_usd_per_litre=0.671,
        wtw_factor_kg_per_l=3.24
    ),
    FuelType.LNG: FuelSpec(
        name=FuelType.LNG,
        lhv_mj_per_kg=50.0,
        density_kg_per_l=0.450,
        co2_factor_kg_per_kg=2.750,
        co2_factor_kg_per_l=1.238,
        price_usd_per_tonne=640.0,
        price_usd_per_litre=0.288,
        wtw_factor_kg_per_l=2.45
    ),
    FuelType.METHANOL: FuelSpec(
        name=FuelType.METHANOL,
        lhv_mj_per_kg=19.9,
        density_kg_per_l=0.792,
        co2_factor_kg_per_kg=1.375,
        co2_factor_kg_per_l=1.089,
        price_usd_per_tonne=750.0,
        price_usd_per_litre=0.594,
        wtw_factor_kg_per_l=1.65
    ),
    FuelType.HYDROGEN: FuelSpec(
        name=FuelType.HYDROGEN,
        lhv_mj_per_kg=120.0,
        density_kg_per_l=0.071,
        co2_factor_kg_per_kg=0.000,
        co2_factor_kg_per_l=0.000,
        price_usd_per_tonne=3200.0,
        price_usd_per_litre=0.227,
        wtw_factor_kg_per_l=0.35
    ),
    FuelType.AMMONIA: FuelSpec(
        name=FuelType.AMMONIA,
        lhv_mj_per_kg=18.6,
        density_kg_per_l=0.682,
        co2_factor_kg_per_kg=0.000,
        co2_factor_kg_per_l=0.000,
        price_usd_per_tonne=820.0,
        price_usd_per_litre=0.559,
        wtw_factor_kg_per_l=0.45
    ),
    FuelType.BIOFUEL: FuelSpec(
        name=FuelType.BIOFUEL,
        lhv_mj_per_kg=38.0,
        density_kg_per_l=0.880,
        co2_factor_kg_per_kg=1.150,
        co2_factor_kg_per_l=1.012,
        price_usd_per_tonne=950.0,
        price_usd_per_litre=0.836,
        wtw_factor_kg_per_l=1.20
    ),
    FuelType.ELECTRIC: FuelSpec(
        name=FuelType.ELECTRIC,
        lhv_mj_per_kg=120.0,
        density_kg_per_l=1.000,
        co2_factor_kg_per_kg=0.350,
        co2_factor_kg_per_l=0.350,
        price_usd_per_tonne=420.0,
        price_usd_per_litre=0.420,
        wtw_factor_kg_per_l=0.35
    ),
}


class Vessel(BaseModel):
    vessel_id: str
    name: str
    vessel_type: VesselType
    capacity_tonnes: float = Field(..., description="Deadweight carrying capacity in tonnes")
    engine_power_kw: float = Field(..., description="Maximum continuous engine power rating in kW")
    min_speed_knots: float = 10.0
    max_speed_knots: float = 24.0
    design_speed_knots: float = 18.0
    compatible_fuels: List[FuelType] = Field(default_factory=lambda: [FuelType.CONVENTIONAL, FuelType.VLSFO, FuelType.MGO])
    current_port: str = "Singapore (SGP)"
    op_cost_per_hour: float = 450.0
    available: bool = True
    status: str = "Active"
    reliability: float = 0.98
    cii_rating: Optional[str] = "C"
    base_consumption_rate: Optional[float] = 35.0
    auxiliary_consumption: Optional[float] = 3.0
    boiler_consumption: Optional[float] = 1.5


class CargoDemand(BaseModel):
    demand_id: str
    origin_port: str
    destination_port: str
    cargo_tonnes: float
    deadline_hours: float
    priority: int = 1
    cargo_type: str = "General Dry / Intermodal"


class CandidateRoute(BaseModel):
    route_id: str
    name: str
    origin_port: str
    destination_port: str
    distance_nm: float
    weather_condition: WeatherCondition = WeatherCondition.MODERATE
    avg_wind_speed_knots: float = 14.0
    avg_wave_height_m: float = 2.2
    avg_current_knots: float = 0.8
    current_direction_deg: float = 45.0
    congestion_risk: float = 0.15  # 0 to 1
    reliability: float = 0.95
    route_category: str = "Balanced"  # Shortest, Fuel-efficient, Weather-optimized, Low-risk, Balanced
    waypoints: List[Dict[str, Any]] = Field(default_factory=list)


class OptimizationObjectiveWeights(BaseModel):
    w_fuel: float = 0.30
    w_cost: float = 0.25
    w_emission: float = 0.25
    w_time: float = 0.15
    w_risk: float = 0.05


class OptimizationRequest(BaseModel):
    vessel_ids: Optional[List[str]] = None
    demand_ids: Optional[List[str]] = None
    speed_options: List[float] = Field(default_factory=lambda: [12.0, 14.0, 16.0, 18.0])
    fuel_options: Optional[List[FuelType]] = None
    weights: OptimizationObjectiveWeights = Field(default_factory=OptimizationObjectiveWeights)
    emission_cap_tonnes: Optional[float] = None
    penalty_weights: Optional[Dict[str, float]] = None
    solver_type: str = "SimulatedAnnealing"  # SimulatedAnnealing, Greedy, ShortestPath, GeneticAlgorithm
    cooling_rate: float = 0.98
    iterations: int = 3000
    initial_temperature: float = 100.0


class AssignmentPlanItem(BaseModel):
    vessel_id: str
    vessel_name: str
    vessel_type: str
    cargo_demand_id: str
    origin_port: str
    destination_port: str
    cargo_tonnes: float
    capacity_utilization_pct: float
    route_id: str
    route_name: str
    distance_nm: float
    speed_knots: float
    fuel_type: str
    predicted_fuel_litres: float
    fuel_cost_usd: float
    operating_cost_usd: float
    total_cost_usd: float
    co2_emission_kg: float
    travel_time_hours: float
    deadline_hours: float
    is_feasible: bool
    violation_notes: List[str] = Field(default_factory=list)
    explanation: Dict[str, Any] = Field(default_factory=dict)


class ParetoAlternative(BaseModel):
    label: str  # "Lowest Fuel", "Lowest Cost", "Lowest Emissions", "Fastest", "Recommended"
    objective_value: float
    total_fuel_litres: float
    total_cost_usd: float
    total_co2_kg: float
    total_time_hours: float
    is_feasible: bool
    plan: List[AssignmentPlanItem]


class OptimizationResult(BaseModel):
    optimization_id: str
    timestamp: str
    solver_used: str
    objective_value: float
    total_fuel_litres: float
    total_fuel_cost_usd: float
    total_operating_cost_usd: float
    total_cost_usd: float
    total_co2_kg: float
    total_time_hours: float
    avg_capacity_utilization_pct: float
    constraint_violations: int
    is_fully_feasible: bool
    plan: List[AssignmentPlanItem]
    pareto_alternatives: List[ParetoAlternative] = Field(default_factory=list)
    convergence_history: List[Dict[str, float]] = Field(default_factory=list)
    qubo_metadata: Dict[str, Any] = Field(default_factory=dict)
    baseline_comparison: Dict[str, Any] = Field(default_factory=dict)
    runtime_ms: float


class FuelPredictionInput(BaseModel):
    vessel_id: Optional[str] = None
    vessel_name: Optional[str] = None
    route_name: Optional[str] = None
    vessel_type: VesselType = VesselType.CONTAINER
    capacity_tonnes: float = 85000.0
    cargo_load_tonnes: float = 60000.0
    engine_power_kw: float = 48000.0
    speed_knots: float = 17.5
    distance_nm: float = 3200.0
    wind_speed_knots: float = 14.0
    wave_height_m: float = 2.0
    current_speed_knots: float = 0.8
    weather_condition: WeatherCondition = WeatherCondition.MODERATE
    fuel_type: FuelType = FuelType.VLSFO
    shore_power: int = 0
    selected_model: str = "catboost"


class FuelPredictionOutput(BaseModel):
    prediction_id: Optional[str] = None
    vessel_id: Optional[str] = None
    vessel_name: Optional[str] = None
    route_name: Optional[str] = None
    hybrid_prediction_litres: float
    ml_prediction_litres: float
    physics_prediction_litres: float
    uncertainty_litres: float
    confidence_interval_95: List[float] = Field(default_factory=list)
    predicted_fuel_cost_usd: float
    predicted_co2_kg: float
    travel_time_hours: float
    data_source: str = "ML/reference prediction"
    feature_contributions: Dict[str, float] = Field(default_factory=dict)
    predicted_fuel_mt: Optional[float] = None
    predicted_cost_usd: Optional[float] = None
    wtw_co2_tonnes: Optional[float] = None
    cii_score: Optional[float] = None
    cii_rating: Optional[str] = None
    prediction_source: Optional[str] = None


class FuelPredictionRecord(BaseModel):
    id: str
    vessel_id: str
    vessel_name: str
    speed_knots: float
    draft_meters: float
    cargo_load_pct: float
    fuel_type: str
    weather_severity: float
    distance_nm: float
    route_name: Optional[str] = None
    predicted_fuel_mt: float
    predicted_cost_usd: float
    co2_emissions_mt: float
    cii_score: float
    cii_rating: str
    breakdown: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None


class RouteRecord(BaseModel):
    id: str
    name: str
    origin_port: str
    destination_port: str
    distance_nm: float
    avg_weather_severity: float
    seca_distance_pct: float
    waypoints: Optional[List[Dict[str, Any]]] = None

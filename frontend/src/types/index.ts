export type VesselType = 'Container' | 'Bulk Carrier' | 'Oil Tanker' | 'LNG Carrier' | 'Ro-Ro Ferry' | 'Heavy Duty Truck';
export type FuelType = 'HFO' | 'MGO' | 'LNG' | 'Biofuel' | 'Electric';
export type WeatherCondition = 'Calm' | 'Moderate' | 'Rough' | 'Stormy';

export interface Vessel {
  vessel_id: string;
  name: string;
  vessel_type: VesselType;
  capacity_tonnes: number;
  engine_power_kw: number;
  min_speed_knots: number;
  max_speed_knots: number;
  design_speed_knots: number;
  compatible_fuels: FuelType[];
  current_port: string;
  op_cost_per_hour: number;
  available: boolean;
  cii_rating?: string;
  base_consumption_rate?: number;
  auxiliary_consumption?: number;
  boiler_consumption?: number;
}

export interface CargoDemand {
  demand_id: string;
  origin_port: string;
  destination_port: string;
  cargo_tonnes: number;
  deadline_hours: number;
  priority: number;
  cargo_type: string;
}

export interface Waypoint {
  name: string;
  lat: number;
  lon: number;
}

export interface CandidateRoute {
  route_id: string;
  name: string;
  origin_port: string;
  destination_port: string;
  distance_nm: number;
  weather_condition: WeatherCondition;
  avg_wind_speed_knots: number;
  avg_wave_height_m: number;
  avg_current_knots: number;
  congestion_risk: number;
  waypoints?: Waypoint[];
}

export interface OptimizationWeights {
  w_fuel: number;
  w_cost: number;
  w_emission: number;
  w_time: number;
  w_risk: number;
}

export interface OptimizationRequest {
  vessel_ids?: string[];
  demand_ids?: string[];
  speed_options?: number[];
  fuel_options?: FuelType[];
  weights?: OptimizationWeights;
  emission_cap_tonnes?: number;
  solver_type?: string;
  cooling_rate?: number;
  iterations?: number;
  initial_temperature?: number;
}

export interface AssignmentPlanItem {
  vessel_id: string;
  vessel_name: string;
  vessel_type: string;
  cargo_demand_id: string;
  origin_port: string;
  destination_port: string;
  cargo_tonnes: number;
  capacity_utilization_pct: number;
  route_id: string;
  route_name: string;
  distance_nm: number;
  speed_knots: number;
  fuel_type: string;
  predicted_fuel_litres: number;
  fuel_cost_usd: number;
  operating_cost_usd: number;
  total_cost_usd: number;
  co2_emission_kg: number;
  travel_time_hours: number;
  deadline_hours: number;
  is_feasible: boolean;
  violation_notes: string[];
  explanation?: {
    why_selected?: string[];
    trade_offs?: Record<string, string>;
  };
}

export interface OptimizationResult {
  optimization_id: string;
  timestamp: string;
  solver_used: string;
  objective_value: number;
  total_fuel_litres: number;
  total_fuel_cost_usd: number;
  total_operating_cost_usd: number;
  total_cost_usd: number;
  total_co2_kg: number;
  total_time_hours: number;
  avg_capacity_utilization_pct: number;
  constraint_violations: number;
  is_fully_feasible: boolean;
  plan: AssignmentPlanItem[];
  convergence_history: Array<{
    iteration: number;
    temperature: number;
    current_energy: number;
    best_energy: number;
    acceptance_rate: number;
  }>;
  qubo_metadata: {
    num_variables: number;
    num_nonzero_terms: number;
    matrix_density_percent: number;
    downsampled_heatmap: number[][];
  };
  baseline_comparison: {
    baseline_fuel_litres: number;
    baseline_total_cost_usd: number;
    baseline_co2_kg: number;
    baseline_time_hours: number;
    fuel_saved_pct: number;
    cost_saved_pct: number;
    co2_reduced_pct: number;
    time_diff_pct: number;
  };
  runtime_ms: number;
}

export interface FuelPredictionInput {
  vessel_id?: string;
  vessel_name?: string;
  route_name?: string;
  vessel_type: VesselType;
  capacity_tonnes: number;
  cargo_load_tonnes: number;
  engine_power_kw: number;
  speed_knots: number;
  distance_nm: number;
  wind_speed_knots: number;
  wave_height_m: number;
  current_speed_knots: number;
  weather_condition: WeatherCondition;
  fuel_type: FuelType;
  shore_power?: number;
  selected_model?: string;
}

export interface ModelPredictionDetail {
  model_name: string;
  predicted_litres: number;
  mae_estimate: number;
}

export interface FuelPredictionOutput {
  prediction_id?: string;
  vessel_id?: string;
  vessel_name?: string;
  route_name?: string;
  ml_prediction_litres: number;
  physics_prediction_litres: number;
  hybrid_prediction_litres: number;
  hybrid_weights?: { ml: number; physics: number };
  predicted_co2_kg: number;
  predicted_fuel_cost_usd: number;
  travel_time_hours: number;
  uncertainty_litres?: number;
  models_breakdown?: ModelPredictionDetail[];
  best_ml_model_name?: string;
  confidence_interval_95?: number[];
  data_source?: string;
  prediction_source?: string;
  predicted_fuel_mt?: number;
  predicted_cost_usd?: number;
  wtw_co2_tonnes?: number;
  cii_score?: number;
  cii_rating?: string;
  feature_contributions?: Record<string, number>;
}

export interface BenchmarkRow {
  algorithm: string;
  objective_value: number;
  total_fuel_litres: number;
  total_fuel_cost_usd: number;
  total_op_cost_usd: number;
  total_cost_usd: number;
  total_co2_kg: number;
  total_co2_tonnes: number;
  total_travel_time_hours: number;
  runtime_ms: number;
  constraint_violations: number;
  is_feasible: boolean;
}

export interface BenchmarkResponse {
  num_vessels: number;
  num_demands: number;
  num_qubo_variables: number;
  benchmark_table: BenchmarkRow[];
  improvement_vs_baseline: {
    fuel_savings_pct: number;
    cost_savings_pct: number;
    co2_reduction_pct: number;
    time_diff_pct: number;
    runtime_ratio: number;
  };
  disclaimer: string;
}

export interface ScalabilityRecord {
  fleet_size: number;
  num_qubo_variables: number;
  sa_runtime_ms: number;
  greedy_runtime_ms: number;
  sa_objective: number;
  greedy_objective: number;
  is_feasible: boolean;
}

export interface AnalyticsResponse {
  total_active_vessels: number;
  total_fleet_capacity_tonnes: number;
  fuel_distribution_pct: Record<string, number>;
  imo_cii_ratings: Record<string, number>;
  avg_fleet_age_years: number;
  carbon_tax_saved_estimated_usd: number;
}

export interface FuelPredictionRecord {
  id: string;
  vessel_id: string;
  vessel_name: string;
  speed_knots: number;
  draft_meters: number;
  cargo_load_pct: number;
  fuel_type: string;
  weather_severity: number;
  distance_nm: number;
  route_name?: string;
  predicted_fuel_mt: number;
  predicted_cost_usd: number;
  co2_emissions_mt: number;
  cii_score: number;
  cii_rating: string;
  breakdown?: {
    ml_litres?: number;
    physics_litres?: number;
    travel_time_hours?: number;
    uncertainty_litres?: number;
  };
  created_at?: string;
}

export interface RouteRecord {
  id: string;
  name: string;
  origin_port: string;
  destination_port: string;
  distance_nm: number;
  avg_weather_severity: number;
  seca_distance_pct: number;
  waypoints?: Array<{ name: string; lat: number; lon: number }>;
}


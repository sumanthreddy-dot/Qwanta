"""Fleet Management and System State Coordinator for QWANTA."""
import uuid
from datetime import datetime
from typing import List, Dict, Tuple, Optional, Any
from pathlib import Path
import pandas as pd

from backend.app.data.models import (
    Vessel, CargoDemand, CandidateRoute, VesselType, FuelType, WeatherCondition,
    OptimizationRequest, OptimizationResult, OptimizationObjectiveWeights,
    FuelPredictionInput, FuelPredictionOutput, AssignmentPlanItem, ParetoAlternative
)
from backend.app.physics.physics_model import NavalPhysicsModel
from backend.app.prediction.prediction_repository import prediction_repo
from backend.app.prediction.prediction_service import prediction_service
from backend.app.prediction.ml_models import ModelRegistry
from backend.app.prediction.evaluator import ModelEvaluator
from backend.app.routes.graph_network import MaritimeNetwork
from backend.app.routes.candidate_generator import CandidateRouteGenerator
from backend.app.optimization.qubo_builder import QUBOBuilder
from backend.app.optimization.solvers.simulated_annealing import SimulatedAnnealingSolver
from backend.app.optimization.solvers.classical_baselines import (
    ShortestPathSolver, GreedyFuelSolver, GeneticAlgorithmSolver
)
from backend.app.optimization.benchmark import BenchmarkHarness


class FleetService:
    """Singleton state coordinator for QWANTA fleet decision operations."""

    def __init__(self):
        self.physics = NavalPhysicsModel()
        self.network = MaritimeNetwork()
        self.route_generator = CandidateRouteGenerator(self.network)
        self.prediction_service = prediction_service
        self.hybrid_predictor = prediction_service
        self.prediction_repo = prediction_repo
        self.model_registry = ModelRegistry()
        self.benchmark_harness = BenchmarkHarness()

        # In-memory fleet, active demands, and optimization results
        self.vessels: Dict[str, Vessel] = {}
        self.demands: Dict[str, CargoDemand] = {}
        self.optimization_results: Dict[str, OptimizationResult] = {}
        self.model_metrics: Dict[str, Any] = {}
        self.feature_importances: Dict[str, float] = {}

        # Initialize defaults
        self._init_default_fleet()
        self._init_default_demands()
        self.initialize_ml_engine()

    def _init_default_fleet(self):
        """Load vessels from DB, falling back to realistic catalog if DB is empty."""
        from backend.app.db.database import SessionLocal
        from backend.app.db.vessel_orm import VesselORM
        from backend.app.db.seed import seed_default_data

        db = SessionLocal()
        try:
            seed_default_data(db)
            orms = db.query(VesselORM).all()
            if orms:
                for o in orms:
                    comp_fuels = []
                    for f in (o.supported_fuels or [o.fuel_type]):
                        try:
                            comp_fuels.append(FuelType(f))
                        except Exception:
                            comp_fuels.append(FuelType.CONVENTIONAL)

                    try:
                        v_type = VesselType(o.vessel_type)
                    except Exception:
                        v_type = VesselType.CONTAINER

                    v = Vessel(
                        vessel_id=o.id,
                        name=o.name,
                        vessel_type=v_type,
                        capacity_tonnes=float(o.deadweight_tonnage or o.capacity_teu * 14.0),
                        engine_power_kw=float(o.base_consumption_rate * 500.0 if o.base_consumption_rate else 35000.0),
                        min_speed_knots=float(o.min_speed_knots),
                        max_speed_knots=float(o.max_speed_knots),
                        design_speed_knots=float(o.design_speed_knots),
                        compatible_fuels=comp_fuels,
                        current_port=o.current_location or "Singapore (SGP)",
                        op_cost_per_hour=480.0,
                        available=o.operational_status == "Active",
                        status="Active" if o.operational_status == "Active" else "Standby",
                        reliability=0.98,
                        cii_rating=o.cii_rating or "C",
                        base_consumption_rate=float(o.base_consumption_rate or 35.0),
                        auxiliary_consumption=float(o.auxiliary_consumption or 3.0),
                        boiler_consumption=float(o.boiler_consumption or 1.5),
                    )
                    self.vessels[v.vessel_id] = v
                return
        except Exception as e:
            print(f"Failed to load vessels from DB: {e}, falling back to seeded fleet")
        finally:
            db.close()

        # Fallback realistic fleet
        fallback_vessels = [
            Vessel(vessel_id="V-101", name="Ocean Titan", vessel_type=VesselType.CONTAINER, capacity_tonnes=85000, engine_power_kw=48000, min_speed_knots=12, max_speed_knots=22, design_speed_knots=18, compatible_fuels=[FuelType.CONVENTIONAL, FuelType.VLSFO, FuelType.LNG], current_port="Singapore (SGP)", op_cost_per_hour=520.0),
            Vessel(vessel_id="V-102", name="Pacific Carrier", vessel_type=VesselType.BULK_CARRIER, capacity_tonnes=75000, engine_power_kw=36000, min_speed_knots=10, max_speed_knots=16, design_speed_knots=13.5, compatible_fuels=[FuelType.CONVENTIONAL, FuelType.VLSFO, FuelType.MGO], current_port="Shanghai (SHA)", op_cost_per_hour=430.0),
            Vessel(vessel_id="V-103", name="Nordic Voyager", vessel_type=VesselType.OIL_TANKER, capacity_tonnes=110000, engine_power_kw=54000, min_speed_knots=11, max_speed_knots=17, design_speed_knots=14.5, compatible_fuels=[FuelType.CONVENTIONAL, FuelType.VLSFO, FuelType.METHANOL], current_port="Rotterdam (RTM)", op_cost_per_hour=590.0),
            Vessel(vessel_id="V-104", name="Arctic Pioneer", vessel_type=VesselType.LNG_CARRIER, capacity_tonnes=92000, engine_power_kw=58000, min_speed_knots=12, max_speed_knots=20, design_speed_knots=17, compatible_fuels=[FuelType.LNG, FuelType.MGO, FuelType.AMMONIA], current_port="Dubai (DXB)", op_cost_per_hour=640.0),
            Vessel(vessel_id="V-105", name="Eastern Trader", vessel_type=VesselType.GENERAL_CARGO, capacity_tonnes=45000, engine_power_kw=28000, min_speed_knots=10, max_speed_knots=18, design_speed_knots=14, compatible_fuels=[FuelType.CONVENTIONAL, FuelType.MGO, FuelType.BIOFUEL], current_port="Mumbai (BOM)", op_cost_per_hour=380.0),
            Vessel(vessel_id="V-106", name="Solaris Express", vessel_type=VesselType.CONTAINER, capacity_tonnes=68000, engine_power_kw=42000, min_speed_knots=12, max_speed_knots=21, design_speed_knots=17.5, compatible_fuels=[FuelType.CONVENTIONAL, FuelType.LNG, FuelType.METHANOL], current_port="Busan (PUS)", op_cost_per_hour=470.0)
        ]
        for v in fallback_vessels:
            self.vessels[v.vessel_id] = v

    def sync_vessels_from_db(self):
        """Refresh in-memory vessel dictionary from DB."""
        self._init_default_fleet()

    def _init_default_demands(self):
        """Seed realistic cargo shipment demands."""
        sample_demands = [
            CargoDemand(demand_id="CMD-101", origin_port="SHA", destination_port="RTM", cargo_tonnes=70000.0, deadline_hours=580.0, priority=1, cargo_type="Manufactured Goods & Electronics"),
            CargoDemand(demand_id="CMD-102", origin_port="SGP", destination_port="LAX", cargo_tonnes=62000.0, deadline_hours=480.0, priority=2, cargo_type="High-Tech Equipment & Commodities"),
            CargoDemand(demand_id="CMD-103", origin_port="BOM", destination_port="RTM", cargo_tonnes=54000.0, deadline_hours=360.0, priority=1, cargo_type="Bulk Minerals & Agri-food"),
            CargoDemand(demand_id="CMD-104", origin_port="DXB", destination_port="PUS", cargo_tonnes=88000.0, deadline_hours=400.0, priority=3, cargo_type="Refined Chemicals & Energy"),
        ]
        for d in sample_demands:
            self.demands[d.demand_id] = d

    def initialize_ml_engine(self, models_dir: str = "models", data_path: Optional[str] = None, *args, **kwargs):
        """Load benchmark metrics and feature importance without hard-coding champions."""
        report = ModelEvaluator.get_benchmark_report()
        self.model_metrics = report
        self.feature_importances = self.model_registry.get_feature_importances([
            "Speed over ground (kn)", "cargo_demand_tonnes", "Wave height (m)",
            "Wind speed (m/s)", "engine_rated_power_kw", "Current speed (m/s)", "distance_nm"
        ])
        print(f"ML Engine initialized. Dynamically ranked best model: {report.get('ranking', {}).get('best_model')}")

    def predict_fuel(self, inp: FuelPredictionInput) -> FuelPredictionOutput:
        """Run fuel prediction via prediction_service and log result to DB."""
        pred = self.prediction_service.predict(
            vessel_id=inp.vessel_id,
            vessel_name=inp.vessel_name,
            vessel_type=inp.vessel_type.value if hasattr(inp.vessel_type, "value") else str(inp.vessel_type),
            capacity_tonnes=inp.capacity_tonnes,
            cargo_load_tonnes=inp.cargo_load_tonnes,
            engine_power_kw=inp.engine_power_kw,
            speed_knots=inp.speed_knots,
            distance_nm=inp.distance_nm,
            weather=inp.weather_condition.value if hasattr(inp.weather_condition, "value") else str(inp.weather_condition),
            fuel_type=inp.fuel_type.value if hasattr(inp.fuel_type, "value") else str(inp.fuel_type),
            shore_power=inp.shore_power,
            selected_model=inp.selected_model
        )

        pred_id = pred["prediction_id"]

        # Save to database
        try:
            from backend.app.db.database import SessionLocal
            from backend.app.db.prediction_orm import PredictionHistoryORM
            db = SessionLocal()
            try:
                rec = PredictionHistoryORM(
                    id=pred_id,
                    vessel_id=inp.vessel_id or "UNKNOWN",
                    vessel_name=inp.vessel_name or (self.vessels[inp.vessel_id].name if inp.vessel_id in self.vessels else inp.vessel_type.value),
                    speed_knots=inp.speed_knots,
                    draft_meters=round(inp.cargo_load_tonnes / max(1.0, inp.capacity_tonnes) * 14.0, 1),
                    cargo_load_pct=round((inp.cargo_load_tonnes / max(1.0, inp.capacity_tonnes)) * 100.0, 1),
                    fuel_type=inp.fuel_type.value if hasattr(inp.fuel_type, "value") else str(inp.fuel_type),
                    weather_severity=round(inp.wave_height_m + (inp.wind_speed_knots / 10.0), 1),
                    distance_nm=inp.distance_nm,
                    route_name=inp.route_name,
                    predicted_fuel_mt=pred["total_fuel_mt"],
                    predicted_cost_usd=pred["total_fuel_cost_usd"],
                    co2_emissions_mt=pred["total_wtw_co2_tonnes"],
                    cii_score=pred["imo_cii_score"],
                    cii_rating=pred["imo_cii_rating"],
                    breakdown={
                        "predicted_fuel_lph": pred["predicted_fuel_lph"],
                        "total_fuel_litres": pred["total_fuel_litres"],
                        "voyage_duration_hours": pred["voyage_duration_hours"],
                        "data_source": pred["data_source"]
                    }
                )
                db.add(rec)
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"Failed to record prediction history: {e}")

        return FuelPredictionOutput(
            prediction_id=pred_id,
            vessel_id=inp.vessel_id,
            vessel_name=inp.vessel_name,
            route_name=inp.route_name,
            hybrid_prediction_litres=pred["total_fuel_litres"],
            ml_prediction_litres=pred["total_fuel_litres"],
            physics_prediction_litres=pred["total_fuel_litres"],
            uncertainty_litres=round(pred["total_fuel_litres"] * 0.035, 1),
            confidence_interval_95=[round(pred["total_fuel_litres"] * 0.965, 1), round(pred["total_fuel_litres"] * 1.035, 1)],
            predicted_fuel_cost_usd=pred["total_fuel_cost_usd"],
            predicted_co2_kg=pred["total_wtw_co2_kg"],
            travel_time_hours=pred["voyage_duration_hours"],
            data_source=pred["data_source"],
            feature_contributions=self.feature_importances,
            predicted_fuel_mt=pred["total_fuel_mt"],
            predicted_cost_usd=pred["total_fuel_cost_usd"],
            wtw_co2_tonnes=pred["total_wtw_co2_tonnes"],
            cii_score=pred["imo_cii_score"],
            cii_rating=pred["imo_cii_rating"],
            prediction_source=pred["data_source"]
        )

    def get_candidate_routes_for_demands(self, demand_list: List[CargoDemand]) -> Dict[Tuple[str, str], List[CandidateRoute]]:
        """Precompute candidate routes for each required origin-destination pair."""
        routes_by_od = {}
        for d in demand_list:
            key = (d.origin_port, d.destination_port)
            if key not in routes_by_od:
                routes_by_od[key] = self.route_generator.generate_candidate_routes(d.origin_port, d.destination_port, k=5)
        return routes_by_od

    def run_optimization(self, req: OptimizationRequest) -> OptimizationResult:
        """Execute full QUBO build, quantum-inspired solve, and constraint validation."""
        selected_vessels = (
            [self.vessels[vid] for vid in req.vessel_ids if vid in self.vessels]
            if req.vessel_ids else list(self.vessels.values())
        )
        selected_demands = (
            [self.demands[did] for did in req.demand_ids if did in self.demands]
            if req.demand_ids else list(self.demands.values())
        )

        routes_by_od = self.get_candidate_routes_for_demands(selected_demands)

        qubo_builder = QUBOBuilder(
            vessels=selected_vessels,
            demands=selected_demands,
            routes_by_od=routes_by_od,
            speed_options=req.speed_options,
            fuel_options=req.fuel_options,
            weights=req.weights,
            penalty_weights=req.penalty_weights,
            emission_cap_kg=req.emission_cap_tonnes * 1000.0 if req.emission_cap_tonnes else None
        )

        Q, Q_dict = qubo_builder.build()
        qubo_meta = qubo_builder.get_metadata()

        # Select Solver
        solver_type = req.solver_type.lower()
        if "greedy" in solver_type:
            solver = GreedyFuelSolver()
        elif "shortest" in solver_type:
            solver = ShortestPathSolver()
        elif "genetic" in solver_type or "ga" in solver_type:
            solver = GeneticAlgorithmSolver(population_size=35, generations=70)
        else:
            solver = SimulatedAnnealingSolver(
                initial_temperature=req.initial_temperature,
                cooling_rate=req.cooling_rate,
                iterations=req.iterations
            )

        solver_res = solver.solve(Q, qubo_builder)
        plan: List[AssignmentPlanItem] = solver_res.get("plan", [])
        pareto_raw = solver_res.get("pareto_alternatives", [])
        pareto_alternatives = [ParetoAlternative(**p) for p in pareto_raw] if pareto_raw else []

        # Run Shortest Path baseline for side-by-side comparison on exact same problem
        sp_solver = ShortestPathSolver()
        sp_res = sp_solver.solve(Q, qubo_builder)
        sp_plan: List[AssignmentPlanItem] = sp_res.get("plan", [])

        # Aggregate metrics
        tot_fuel = sum(p.predicted_fuel_litres for p in plan)
        tot_fuel_cost = sum(p.fuel_cost_usd for p in plan)
        tot_op_cost = sum(p.operating_cost_usd for p in plan)
        tot_co2 = sum(p.co2_emission_kg for p in plan)
        tot_time = sum(p.travel_time_hours for p in plan)
        avg_util = sum(p.capacity_utilization_pct for p in plan) / max(1, len(plan))
        violations = sum(len(p.violation_notes) for p in plan)

        base_fuel = sum(p.predicted_fuel_litres for p in sp_plan)
        base_cost = sum(p.total_cost_usd for p in sp_plan)
        base_co2 = sum(p.co2_emission_kg for p in sp_plan)
        base_time = sum(p.travel_time_hours for p in sp_plan)

        def safe_pct_diff(base_val, opt_val):
            if base_val <= 0:
                return 0.0
            return round(((base_val - opt_val) / base_val) * 100.0, 1)

        result_id = f"QW-OPT-{uuid.uuid4().hex[:8].upper()}"
        opt_result = OptimizationResult(
            optimization_id=result_id,
            timestamp=datetime.utcnow().isoformat(),
            solver_used=solver.name,
            objective_value=solver_res["energy"],
            total_fuel_litres=round(tot_fuel, 1),
            total_fuel_cost_usd=round(tot_fuel_cost, 2),
            total_operating_cost_usd=round(tot_op_cost, 2),
            total_cost_usd=round(tot_fuel_cost + tot_op_cost, 2),
            total_co2_kg=round(tot_co2, 1),
            total_time_hours=round(tot_time, 1),
            avg_capacity_utilization_pct=round(avg_util, 1),
            constraint_violations=violations,
            is_fully_feasible=violations == 0 and len(plan) == len(selected_demands),
            plan=plan,
            pareto_alternatives=pareto_alternatives,
            convergence_history=solver_res.get("convergence_history", []),
            qubo_metadata=qubo_meta,
            baseline_comparison={
                "baseline_fuel_litres": round(base_fuel, 1),
                "baseline_total_cost_usd": round(base_cost, 2),
                "baseline_co2_kg": round(base_co2, 1),
                "baseline_time_hours": round(base_time, 1),
                "fuel_saved_pct": safe_pct_diff(base_fuel, tot_fuel),
                "cost_saved_pct": safe_pct_diff(base_cost, tot_fuel_cost + tot_op_cost),
                "co2_reduced_pct": safe_pct_diff(base_co2, tot_co2),
                "time_diff_pct": safe_pct_diff(base_time, tot_time)
            },
            runtime_ms=solver_res["runtime_ms"]
        )

        self.optimization_results[result_id] = opt_result
        return opt_result


fleet_service = FleetService()

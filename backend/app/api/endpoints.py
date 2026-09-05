"""REST API Endpoints for QWANTA — A Fleet Decision Engine."""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from backend.app.data.models import (
    Vessel, CargoDemand, CandidateRoute, OptimizationRequest, OptimizationResult,
    FuelPredictionInput, FuelPredictionOutput, VesselType, FuelType,
    FuelPredictionRecord, RouteRecord
)
from backend.app.services.fleet_service import fleet_service
from backend.app.optimization.qubo_builder import QUBOBuilder
from backend.app.db.database import get_db, SessionLocal
from backend.app.db.vessel_orm import VesselORM
from backend.app.db.prediction_orm import PredictionHistoryORM
from backend.app.db.route_orm import RouteORM
from sqlalchemy.orm import Session
from fastapi import Depends


router = APIRouter(prefix="/api")


# ─── SYSTEM ─────────────────────────────────────────────────────────────────

@router.get("/health", tags=["System"])
def health_check():
    """System health check and loaded engine status."""
    best_model = fleet_service.model_registry.best_model_name if fleet_service.model_registry else "Unknown"
    return {
        "status": "healthy",
        "service": "QWANTA Fleet Decision Engine",
        "version": "2.0.0",
        "ml_engine_ready": fleet_service.hybrid_predictor is not None,
        "best_model": best_model,
        "active_vessels_count": len(fleet_service.vessels),
        "active_demands_count": len(fleet_service.demands)
    }


# ─── FLEET ──────────────────────────────────────────────────────────────────

@router.get("/fleet", response_model=List[Vessel], tags=["Fleet"])
def get_fleet(db: Session = Depends(get_db)):
    """Retrieve all available vessels from database."""
    vessels_orm = db.query(VesselORM).all()
    if not vessels_orm:
        return list(fleet_service.vessels.values())

    result = []
    for o in vessels_orm:
        comp_fuels = []
        for f in (o.supported_fuels or [o.fuel_type]):
            try:
                comp_fuels.append(FuelType(f))
            except Exception:
                comp_fuels.append(FuelType.MGO)
        try:
            v_type = VesselType(o.vessel_type)
        except Exception:
            v_type = VesselType.CONTAINER

        result.append(
            Vessel(
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
                cii_rating=o.cii_rating or "C",
                base_consumption_rate=float(o.base_consumption_rate or 35.0),
                auxiliary_consumption=float(o.auxiliary_consumption or 3.0),
                boiler_consumption=float(o.boiler_consumption or 1.5),
            )
        )
    return result


@router.post("/fleet", response_model=Vessel, status_code=status.HTTP_201_CREATED, tags=["Fleet"])
def add_vessel(vessel: Vessel, db: Session = Depends(get_db)):
    """Add a new vessel to database and sync in-memory fleet."""
    existing = db.query(VesselORM).filter(VesselORM.id == vessel.vessel_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Vessel with ID '{vessel.vessel_id}' already exists")

    supported_fuel_strs = [f.value if hasattr(f, "value") else str(f) for f in vessel.compatible_fuels]
    primary_fuel = supported_fuel_strs[0] if supported_fuel_strs else "VLSFO"

    orm_v = VesselORM(
        id=vessel.vessel_id,
        name=vessel.name,
        vessel_type=vessel.vessel_type.value if hasattr(vessel.vessel_type, "value") else str(vessel.vessel_type),
        capacity_teu=int(vessel.capacity_tonnes / 14.0),
        deadweight_tonnage=vessel.capacity_tonnes,
        design_speed_knots=vessel.design_speed_knots,
        min_speed_knots=vessel.min_speed_knots,
        max_speed_knots=vessel.max_speed_knots,
        fuel_type=primary_fuel,
        supported_fuels=supported_fuel_strs,
        cii_rating=vessel.cii_rating or "C",
        base_consumption_rate=vessel.base_consumption_rate or 35.0,
        auxiliary_consumption=vessel.auxiliary_consumption or 3.0,
        boiler_consumption=vessel.boiler_consumption or 1.5,
        operational_status="Active" if vessel.available else "Maintenance",
        current_location=vessel.current_port,
    )
    db.add(orm_v)
    db.commit()

    fleet_service.vessels[vessel.vessel_id] = vessel
    return vessel


@router.put("/fleet/{vessel_id}", response_model=Vessel, tags=["Fleet"])
def update_vessel(vessel_id: str, vessel: Vessel, db: Session = Depends(get_db)):
    """Update an existing vessel in the database."""
    orm_v = db.query(VesselORM).filter(VesselORM.id == vessel_id).first()
    if not orm_v:
        raise HTTPException(status_code=404, detail="Vessel not found")

    supported_fuel_strs = [f.value if hasattr(f, "value") else str(f) for f in vessel.compatible_fuels]
    orm_v.name = vessel.name
    orm_v.vessel_type = vessel.vessel_type.value if hasattr(vessel.vessel_type, "value") else str(vessel.vessel_type)
    orm_v.capacity_teu = int(vessel.capacity_tonnes / 14.0)
    orm_v.deadweight_tonnage = vessel.capacity_tonnes
    orm_v.design_speed_knots = vessel.design_speed_knots
    orm_v.min_speed_knots = vessel.min_speed_knots
    orm_v.max_speed_knots = vessel.max_speed_knots
    orm_v.fuel_type = supported_fuel_strs[0] if supported_fuel_strs else "VLSFO"
    orm_v.supported_fuels = supported_fuel_strs
    orm_v.cii_rating = vessel.cii_rating or "C"
    orm_v.base_consumption_rate = vessel.base_consumption_rate or 35.0
    orm_v.auxiliary_consumption = vessel.auxiliary_consumption or 3.0
    orm_v.boiler_consumption = vessel.boiler_consumption or 1.5
    orm_v.operational_status = "Active" if vessel.available else "Maintenance"
    orm_v.current_location = vessel.current_port
    db.commit()

    fleet_service.vessels[vessel_id] = vessel
    return vessel


@router.delete("/fleet/{vessel_id}", status_code=status.HTTP_200_OK, tags=["Fleet"])
def delete_vessel(vessel_id: str, db: Session = Depends(get_db)):
    """Delete a vessel from database and update in-memory fleet."""
    v = db.query(VesselORM).filter(VesselORM.id == vessel_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vessel not found")
    db.delete(v)
    db.commit()
    if vessel_id in fleet_service.vessels:
        del fleet_service.vessels[vessel_id]
    return {"message": f"Vessel {vessel_id} deleted successfully"}


# ─── PREDICTION ─────────────────────────────────────────────────────────────

@router.get("/predictions", tags=["Prediction"])
def get_predictions(
    vessel_type: Optional[str] = Query(None, description="e.g. Container"),
    weather: Optional[str] = Query(None, description="e.g. Calm, Moderate, Rough"),
    fuel: Optional[str] = Query(None, description="e.g. VLSFO, LNG, HFO"),
    speed: Optional[float] = Query(None, description="Speed in knots (8–16)"),
    limit: int = Query(50, ge=1, le=270),
):
    """Query stored CSV prediction scenarios with optional filters."""
    try:
        rows = fleet_service.prediction_repo.query_scenarios(
            vessel_type=vessel_type,
            weather=weather,
            fuel=fuel,
            speed=speed,
            limit=limit,
        )
        return {"count": len(rows), "scenarios": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction query failed: {str(e)}")


@router.post("/predict", response_model=FuelPredictionOutput, tags=["Prediction"])
def predict_fuel(input_data: FuelPredictionInput):
    """Predict fuel consumption and emissions using Prediction Repository + Naval Physics."""
    try:
        return fleet_service.predict_fuel(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fuel prediction failed: {str(e)}")


# kept for backwards compatibility
@router.post("/predict-fuel", response_model=FuelPredictionOutput, tags=["Prediction"])
def predict_fuel_legacy(input_data: FuelPredictionInput):
    """(Legacy alias) Predict fuel consumption and emissions."""
    try:
        return fleet_service.predict_fuel(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fuel prediction failed: {str(e)}")


@router.get("/prediction-history", response_model=List[FuelPredictionRecord], tags=["Prediction"])
def get_prediction_history(
    vessel_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve historical fuel predictions logged by the system."""
    query = db.query(PredictionHistoryORM)
    if vessel_id:
        query = query.filter(PredictionHistoryORM.vessel_id == vessel_id)
    records = query.order_by(PredictionHistoryORM.created_at.desc()).limit(limit).all()
    return [
        FuelPredictionRecord(
            id=r.id,
            vessel_id=r.vessel_id,
            vessel_name=r.vessel_name,
            speed_knots=r.speed_knots,
            draft_meters=r.draft_meters,
            cargo_load_pct=r.cargo_load_pct,
            fuel_type=r.fuel_type,
            weather_severity=r.weather_severity,
            distance_nm=r.distance_nm,
            route_name=r.route_name,
            predicted_fuel_mt=r.predicted_fuel_mt,
            predicted_cost_usd=r.predicted_cost_usd,
            co2_emissions_mt=r.co2_emissions_mt,
            cii_score=r.cii_score,
            cii_rating=r.cii_rating,
            breakdown=r.breakdown,
            created_at=r.created_at.isoformat() if r.created_at else None
        )
        for r in records
    ]


# ─── MODELS ─────────────────────────────────────────────────────────────────

@router.get("/models", tags=["Prediction"])
def get_models():
    """Return all 9 ML models with dynamically computed evaluation metrics and ranking."""
    try:
        import json, os
        metrics_path = "results/model_benchmark_metrics.json"
        if os.path.exists(metrics_path):
            with open(metrics_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            model_metrics = data.get("model_metrics", [])
            ranking = data.get("ranking", {})
            best_model = ranking.get("best_model", "Extra Trees")
            return {
                "best_model": best_model,
                "ranking": ranking,
                "models": model_metrics,
                "model_metrics": model_metrics,
                "ranking_criteria": "R² (primary), MAE (secondary)",
                "note": "Rankings are dynamic — no hard-coded champion."
            }
        # Fallback: live compute
        metrics = fleet_service.model_metrics or {}
        model_list = metrics.get("model_metrics", [])
        best_name = metrics.get("ranking", {}).get("best_model", fleet_service.model_registry.best_model_name or "Extra Trees")
        return {
            "best_model": best_name,
            "ranking": metrics.get("ranking", {}),
            "models": model_list,
            "model_metrics": model_list,
            "ranking_criteria": "R² (primary), MAE (secondary)",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model metrics retrieval failed: {str(e)}")


@router.get("/model-metrics", tags=["Prediction"])
def get_model_metrics():
    """Return regression evaluation metrics (MAE, RMSE, R2, MAPE, CI) and feature importances."""
    import json, os
    metrics_path = "results/model_benchmark_metrics.json"
    data = {}
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = fleet_service.model_metrics or {}

    best_model = data.get("ranking", {}).get("best_model", "Extra Trees")
    return {
        "metrics": data,
        "best_model": best_model,
        "feature_importances": fleet_service.feature_importances
    }


# ─── ROUTES ─────────────────────────────────────────────────────────────────

@router.get("/routes", response_model=List[RouteRecord], tags=["Routes"])
def get_routes(db: Session = Depends(get_db)):
    """Retrieve all standardized shipping routes."""
    routes = db.query(RouteORM).all()
    return [
        RouteRecord(
            id=r.id,
            name=r.name,
            origin_port=r.origin_port,
            destination_port=r.destination_port,
            distance_nm=r.distance_nm,
            avg_weather_severity=r.avg_weather_severity,
            seca_distance_pct=r.seca_distance_pct,
            waypoints=r.waypoints or []
        )
        for r in routes
    ]


@router.post("/routes", response_model=RouteRecord, status_code=status.HTTP_201_CREATED, tags=["Routes"])
def create_route(route: RouteRecord, db: Session = Depends(get_db)):
    """Create a new custom route in the system."""
    existing = db.query(RouteORM).filter(RouteORM.id == route.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Route with this ID already exists")

    orm_r = RouteORM(
        id=route.id,
        name=route.name,
        origin_port=route.origin_port,
        destination_port=route.destination_port,
        distance_nm=route.distance_nm,
        avg_weather_severity=route.avg_weather_severity,
        seca_distance_pct=route.seca_distance_pct,
        waypoints=route.waypoints
    )
    db.add(orm_r)
    db.commit()
    return route


@router.get("/demands", response_model=List[CargoDemand], tags=["Demands"])
def get_demands():
    """Retrieve all active cargo shipment demands."""
    return list(fleet_service.demands.values())


@router.post("/demands", response_model=CargoDemand, status_code=status.HTTP_201_CREATED, tags=["Demands"])
def add_demand(demand: CargoDemand):
    """Register a new cargo demand for assignment."""
    fleet_service.demands[demand.demand_id] = demand
    return demand


@router.get("/ports", tags=["Routes"])
def get_ports():
    """Retrieve strategic maritime ports and nodes."""
    return fleet_service.network.get_ports()


@router.get("/corridors", tags=["Routes"])
def get_corridors():
    """Retrieve international shipping corridors."""
    return fleet_service.network.get_corridors()


@router.get("/routes/candidates", response_model=List[CandidateRoute], tags=["Routes"])
def get_candidate_routes(
    origin: str = Query("SHA", description="Origin port code, e.g. SHA"),
    destination: str = Query("RTM", description="Destination port code, e.g. RTM")
):
    """Generate 5 diverse candidate routes for an origin-destination pair."""
    return fleet_service.route_generator.generate_candidate_routes(origin, destination, k=5)


# ─── QUBO & OPTIMIZATION ────────────────────────────────────────────────────

@router.post("/qubo/build", tags=["Optimization"])
def build_qubo(request: OptimizationRequest):
    """Build and return dynamic QUBO matrix with statistics and downsampled heatmap."""
    try:
        selected_vessels = (
            [fleet_service.vessels[vid] for vid in request.vessel_ids if vid in fleet_service.vessels]
            if request.vessel_ids else list(fleet_service.vessels.values())[:6]
        )
        selected_demands = (
            [fleet_service.demands[did] for did in request.demand_ids if did in fleet_service.demands]
            if request.demand_ids else list(fleet_service.demands.values())[:4]
        )
        routes_by_od = fleet_service.get_candidate_routes_for_demands(selected_demands)
        builder = QUBOBuilder(
            vessels=selected_vessels,
            demands=selected_demands,
            routes_by_od=routes_by_od,
            speed_options=request.speed_options,
            fuel_options=request.fuel_options,
            weights=request.weights,
            penalty_weights=request.penalty_weights,
            emission_cap_kg=request.emission_cap_tonnes * 1000.0 if request.emission_cap_tonnes else None
        )
        Q, Q_dict = builder.build()
        meta = builder.get_metadata()
        return {
            "num_variables": meta.get("num_variables", 0),
            "num_nonzero_terms": meta.get("num_nonzero_terms", 0),
            "matrix_density_percent": meta.get("matrix_density_percent", 0.0),
            "downsampled_heatmap": meta.get("downsampled_heatmap", []),
            "metadata": meta,
            "dimensions": meta.get("num_variables", 0),
            "density_pct": meta.get("matrix_density_percent", 0.0),
            "heatmap": meta.get("downsampled_heatmap", []),
            "objective_weights": {
                "w_fuel": request.weights.w_fuel,
                "w_cost": request.weights.w_cost,
                "w_emission": request.weights.w_emission,
                "w_time": request.weights.w_time,
                "w_risk": request.weights.w_risk,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QUBO build failed: {str(e)}")


@router.post("/optimize", response_model=OptimizationResult, tags=["Optimization"])
def run_optimization(request: OptimizationRequest):
    """Formulate multi-objective QUBO and execute Quantum-Inspired Simulated Annealing."""
    try:
        result = fleet_service.run_optimization(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fleet optimization failed: {str(e)}")


@router.get("/optimization/{optimization_id}", response_model=OptimizationResult, tags=["Optimization"])
def get_optimization_result(optimization_id: str):
    """Retrieve a previously calculated optimization plan and convergence history."""
    if optimization_id not in fleet_service.optimization_results:
        raise HTTPException(status_code=404, detail="Optimization ID not found")
    return fleet_service.optimization_results[optimization_id]


# ─── BENCHMARKING ───────────────────────────────────────────────────────────

@router.post("/benchmark", tags=["Benchmarking"])
def run_benchmark():
    """Run side-by-side benchmark: Shortest Path, Greedy, GA, and QUBO+SA."""
    try:
        vessels = list(fleet_service.vessels.values())[:6]
        demands = list(fleet_service.demands.values())[:4]
        routes_by_od = fleet_service.get_candidate_routes_for_demands(demands)
        result = fleet_service.benchmark_harness.run_benchmark(
            vessels=vessels,
            demands=demands,
            routes_by_od=routes_by_od
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark execution failed: {str(e)}")


@router.get("/scalability", tags=["Benchmarking"])
def run_scalability():
    """Run scalability benchmark across 5, 10, 20, 30, 50 fleet configurations."""
    try:
        return fleet_service.benchmark_harness.run_scalability_test([5, 10, 20, 30, 50])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scalability test failed: {str(e)}")


# ─── ANALYTICS / ESG ────────────────────────────────────────────────────────

@router.get("/analytics", tags=["Analytics"])
def get_analytics():
    """Compute fleet-wide ESG KPIs, CII ratings, WTW GHG breakdown, and fuel distribution."""
    vessels = list(fleet_service.vessels.values())
    total_capacity = sum(v.capacity_tonnes for v in vessels)

    # Build real fuel distribution from actual vessel data
    from collections import Counter
    fuel_counts: Counter = Counter()
    for v in vessels:
        for f in (v.compatible_fuels or []):
            fuel_counts[f.value if hasattr(f, "value") else str(f)] += 1
    total_fuel = max(sum(fuel_counts.values()), 1)
    fuel_distribution = {k: round(100 * v / total_fuel, 1) for k, v in fuel_counts.most_common()}

    # CII distribution from vessel records
    cii_counts: Counter = Counter()
    for v in vessels:
        rating = (v.cii_rating or "C").split()[0]
        cii_counts[rating] += 1

    cii_labels = {
        "A": "A (Major Superior)",
        "B": "B (Minor Superior)",
        "C": "C (Moderate)",
        "D": "D (Minor Inferior)",
        "E": "E (Major Inferior)",
    }
    cii_ratings = {cii_labels.get(k, k): v for k, v in cii_counts.items()}

    # WTW GHG from prediction repo speed-curve data
    try:
        wtw_data = fleet_service.prediction_repo.get_fuel_matrix()
        avg_ghg = wtw_data.get("avg_wtw_ghg_kg_per_nm", 28.4)
    except Exception:
        avg_ghg = 28.4

    return {
        "total_active_vessels": len(vessels),
        "total_fleet_capacity_tonnes": total_capacity,
        "fuel_distribution_pct": fuel_distribution,
        "imo_cii_ratings": cii_ratings,
        "avg_wtw_ghg_kg_per_nm": avg_ghg,
        "carbon_intensity_index": 8.3,
        "estimated_annual_fuel_cost_usd": total_capacity * 0.047,
        "carbon_tax_saved_estimated_usd": total_capacity * 0.012,
    }


# ─── EXPLAINABILITY ─────────────────────────────────────────────────────────

@router.get("/explainability/{vessel_id}", tags=["Explainability"])
def get_explainability(vessel_id: str):
    """Explain why a specific vessel was assigned its route, speed, and fuel."""
    if vessel_id not in fleet_service.vessels:
        raise HTTPException(status_code=404, detail="Vessel ID not found")

    vessel = fleet_service.vessels[vessel_id]

    if fleet_service.optimization_results:
        latest = list(fleet_service.optimization_results.values())[-1]
        for item in latest.plan:
            if item.vessel_id == vessel_id:
                return {
                    "vessel_id": vessel_id,
                    "vessel_name": vessel.name,
                    "plan_item": item,
                    "explanation": item.explanation
                }

    return {
        "vessel_id": vessel_id,
        "vessel_name": vessel.name,
        "status": "In Reserve / Standby",
        "rationale": "Vessel was held in reserve as current cargo demands were satisfied by higher fuel-efficiency assets."
    }


# ─── SIH SCENARIOS & TELEMETRY DATASETS ────────────────────────────────────

@router.get("/scenarios", tags=["SIH Scenarios"])
def get_fleet_scenarios(
    route_id: Optional[str] = Query(None, description="Corridor route ID, e.g. R1, R2"),
    vessel_type: Optional[str] = Query(None, description="Vessel class, e.g. Kamsarmax, Handysize"),
    fuel_type: Optional[str] = Query(None, description="Fuel type, e.g. VLSFO, LNG"),
    weather: Optional[str] = Query(None, description="Weather scenario, e.g. Calm, Severe"),
    limit: int = Query(50, ge=1, le=200)
):
    """Retrieve operational scenario records from GreenQ_FleetOptimization_Scenarios.csv."""
    try:
        from backend.app.data.dataset_service import dataset_service
        from backend.app.data.dataset_models import ScenarioQueryFilter
        filters = ScenarioQueryFilter(
            route_id=route_id,
            vessel_type=vessel_type,
            fuel_type=fuel_type,
            weather_scenario=weather,
            limit=limit
        )
        records, total = dataset_service.scenarios_repo.query(filters)
        return {"count": len(records), "total": total, "scenarios": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query scenarios: {str(e)}")


@router.get("/scenarios/summary", tags=["SIH Scenarios"])
def get_scenarios_summary():
    """Retrieve statistical summary of corridors, vessel classes, fuels, and speed profiles."""
    try:
        from backend.app.data.dataset_service import dataset_service
        return dataset_service.scenarios_repo.get_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scenario summary: {str(e)}")


@router.get("/telemetry/stats", tags=["SIH Telemetry"])
def get_telemetry_stats():
    """Retrieve statistical distribution from the Kamsarmax operational telemetry dataset."""
    try:
        from backend.app.data.dataset_service import dataset_service
        return dataset_service.telemetry_repo.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get telemetry stats: {str(e)}")

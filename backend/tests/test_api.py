"""Integration tests for FastAPI endpoints."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.fleet_service import fleet_service


@pytest.fixture(scope="module")
def client():
    # Initialize fleet service data for testing
    fleet_service.initialize_ml_engine(
        data_path="data/synthetic/maritime_operations_15k.csv",
        models_dir="models"
    )
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ml_engine_ready"] is True


def test_fleet_and_demands_endpoints(client):
    resp_fleet = client.get("/api/fleet")
    assert resp_fleet.status_code == 200
    assert len(resp_fleet.json()) > 0

    resp_demands = client.get("/api/demands")
    assert resp_demands.status_code == 200
    assert len(resp_demands.json()) > 0


def test_predict_fuel_endpoint(client):
    payload = {
        "vessel_type": "Container",
        "capacity_tonnes": 85000.0,
        "cargo_load_tonnes": 60000.0,
        "engine_power_kw": 48000.0,
        "speed_knots": 18.0,
        "distance_nm": 2500.0,
        "wind_speed_knots": 15.0,
        "wave_height_m": 2.2,
        "current_speed_knots": 0.8,
        "weather_condition": "Moderate",
        "fuel_type": "LNG"
    }
    response = client.post("/api/predict-fuel", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "ml_prediction_litres" in data
    assert "physics_prediction_litres" in data
    assert "hybrid_prediction_litres" in data
    assert data["hybrid_prediction_litres"] > 0
    assert data["predicted_co2_kg"] > 0


def test_optimize_endpoint(client):
    payload = {
        "speed_options": [16.0, 18.0],
        "solver_type": "SimulatedAnnealing",
        "iterations": 1000
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "optimization_id" in data
    assert len(data["plan"]) > 0
    assert data["runtime_ms"] > 0
    assert "baseline_comparison" in data


def test_models_endpoint(client):
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data or "models_ranked" in data or "best_model" in data or isinstance(data, list)


def test_predictions_csv_endpoint(client):
    response = client.get("/api/predictions?weather=Normal&fuel=Conventional&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "scenarios" in data
    assert len(data["scenarios"]) > 0


def test_qubo_build_endpoint(client):
    payload = {
        "speed_options": [14.0, 16.0],
        "solver_type": "SimulatedAnnealing",
        "iterations": 500
    }
    response = client.post("/api/qubo/build", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "num_variables" in data
    assert "downsampled_heatmap" in data


def test_fleet_crud(client):
    import uuid
    v_id = f"V-TEST-{uuid.uuid4().hex[:6]}"
    # 1. Add vessel
    new_vessel = {
        "vessel_id": v_id,
        "name": f"Test Vessel {v_id}",
        "vessel_type": "Container",
        "capacity_tonnes": 50000.0,
        "engine_power_kw": 30000.0,
        "min_speed_knots": 10.0,
        "max_speed_knots": 20.0,
        "design_speed_knots": 15.0,
        "compatible_fuels": ["Conventional", "LNG"],
        "current_port": "Mumbai (BOM)",
        "op_cost_per_hour": 400.0,
        "available": True,
        "status": "Active",
        "reliability": 0.95
    }
    create_res = client.post("/api/fleet", json=new_vessel)
    assert create_res.status_code in [200, 201]

    # 2. Update vessel
    new_vessel["name"] = f"Test Vessel {v_id} Updated"
    update_res = client.put(f"/api/fleet/{v_id}", json=new_vessel)
    assert update_res.status_code == 200
    assert update_res.json()["name"] == f"Test Vessel {v_id} Updated"

    # 3. Delete vessel
    delete_res = client.delete(f"/api/fleet/{v_id}")
    assert delete_res.status_code == 200


def test_analytics_endpoint(client):
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "total_active_vessels" in data

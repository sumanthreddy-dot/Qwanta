"""Unit tests for QUBO formulation and matrix properties."""
import pytest
import numpy as np
from backend.app.data.models import Vessel, CargoDemand, CandidateRoute, VesselType, FuelType
from backend.app.optimization.qubo_builder import QUBOBuilder
from backend.app.physics.physics_model import NavalPhysicsModel


@pytest.fixture
def small_scenario():
    vessels = [
        Vessel(
            vessel_id="V1",
            name="Vessel-1",
            vessel_type=VesselType.CONTAINER,
            capacity_tonnes=80000.0,
            engine_power_kw=45000.0,
            compatible_fuels=[FuelType.HFO, FuelType.LNG]
        ),
        Vessel(
            vessel_id="V2",
            name="Vessel-2",
            vessel_type=VesselType.BULK_CARRIER,
            capacity_tonnes=70000.0,
            engine_power_kw=12000.0,
            compatible_fuels=[FuelType.HFO, FuelType.MGO]
        )
    ]
    demands = [
        CargoDemand(
            demand_id="D1",
            origin_port="SHA",
            destination_port="RTM",
            cargo_tonnes=60000.0,
            deadline_hours=500.0
        )
    ]
    routes_by_od = {
        ("SHA", "RTM"): [
            CandidateRoute(
                route_id="R1",
                name="Route 1",
                origin_port="SHA",
                destination_port="RTM",
                distance_nm=3000.0
            )
        ]
    }
    return vessels, demands, routes_by_od


def test_qubo_builder_generation(small_scenario):
    vessels, demands, routes_by_od = small_scenario
    builder = QUBOBuilder(
        vessels=vessels,
        demands=demands,
        routes_by_od=routes_by_od,
        speed_options=[16.0, 18.0],
        fuel_options=[FuelType.HFO, FuelType.LNG]
    )

    Q, Q_dict = builder.build()

    assert builder.num_variables > 0
    assert Q.shape == (builder.num_variables, builder.num_variables)
    assert len(Q_dict) > 0


def test_decode_solution(small_scenario):
    vessels, demands, routes_by_od = small_scenario
    builder = QUBOBuilder(
        vessels=vessels,
        demands=demands,
        routes_by_od=routes_by_od,
        speed_options=[16.0],
        fuel_options=[FuelType.HFO]
    )
    Q, _ = builder.build()

    # Active first variable
    x = np.zeros(builder.num_variables, dtype=int)
    x[0] = 1
    plan = builder.decode_solution(x)

    assert len(plan) == 1
    assert plan[0].cargo_demand_id == "D1"
    assert plan[0].is_feasible is True

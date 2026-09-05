"""Unit tests for Simulated Annealing and Classical Baselines."""
import pytest
import numpy as np
from backend.app.data.models import Vessel, CargoDemand, CandidateRoute, VesselType, FuelType
from backend.app.optimization.qubo_builder import QUBOBuilder
from backend.app.optimization.solvers.simulated_annealing import SimulatedAnnealingSolver
from backend.app.optimization.solvers.classical_baselines import (
    ShortestPathSolver, GreedyFuelSolver, GeneticAlgorithmSolver
)


@pytest.fixture
def optimization_setup():
    vessels = [
        Vessel(
            vessel_id="V1",
            name="Vessel-Alpha",
            vessel_type=VesselType.CONTAINER,
            capacity_tonnes=80000.0,
            engine_power_kw=45000.0,
            compatible_fuels=[FuelType.HFO, FuelType.LNG]
        ),
        Vessel(
            vessel_id="V2",
            name="Vessel-Beta",
            vessel_type=VesselType.CONTAINER,
            capacity_tonnes=60000.0,
            engine_power_kw=35000.0,
            compatible_fuels=[FuelType.MGO, FuelType.BIOFUEL]
        )
    ]
    demands = [
        CargoDemand(
            demand_id="D1",
            origin_port="SHA",
            destination_port="RTM",
            cargo_tonnes=50000.0,
            deadline_hours=500.0
        ),
        CargoDemand(
            demand_id="D2",
            origin_port="SGP",
            destination_port="LAX",
            cargo_tonnes=55000.0,
            deadline_hours=450.0
        )
    ]
    routes_by_od = {
        ("SHA", "RTM"): [
            CandidateRoute(route_id="R1", name="R1", origin_port="SHA", destination_port="RTM", distance_nm=3000.0)
        ],
        ("SGP", "LAX"): [
            CandidateRoute(route_id="R2", name="R2", origin_port="SGP", destination_port="LAX", distance_nm=4000.0)
        ]
    }
    builder = QUBOBuilder(
        vessels=vessels,
        demands=demands,
        routes_by_od=routes_by_od,
        speed_options=[16.0, 18.0],
        fuel_options=[FuelType.HFO, FuelType.LNG, FuelType.BIOFUEL]
    )
    Q, _ = builder.build()
    return Q, builder


def test_simulated_annealing_solve(optimization_setup):
    Q, builder = optimization_setup
    solver = SimulatedAnnealingSolver(iterations=1000, cooling_rate=0.97)
    res = solver.solve(Q, builder)

    assert "solution_vector" in res
    assert "energy" in res
    assert res["runtime_ms"] > 0
    assert len(res["convergence_history"]) > 0


def test_baselines_solve(optimization_setup):
    Q, builder = optimization_setup

    sp_solver = ShortestPathSolver()
    sp_res = sp_solver.solve(Q, builder)
    assert len(sp_res["plan"]) > 0

    greedy_solver = GreedyFuelSolver()
    greedy_res = greedy_solver.solve(Q, builder)
    assert len(greedy_res["plan"]) > 0

    ga_solver = GeneticAlgorithmSolver(population_size=15, generations=20)
    ga_res = ga_solver.solve(Q, builder)
    assert len(ga_res["plan"]) > 0

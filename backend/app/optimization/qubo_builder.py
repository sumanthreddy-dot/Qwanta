"""QUBO (Quadratic Unconstrained Binary Optimization) Formulation Engine for QWANTA.

Dynamically constructs the binary combinatorial optimization space x[v, r, s, f, p]
and assembles the Hamiltonian matrix Q incorporating multi-objective weights
and quadratic penalty terms.
"""
from typing import List, Dict, Tuple, Any, Optional
import numpy as np
from backend.app.data.models import (
    Vessel, CargoDemand, CandidateRoute, FuelType, OptimizationObjectiveWeights,
    AssignmentPlanItem, FUEL_CATALOG
)
from backend.app.physics.physics_model import NavalPhysicsModel
from backend.app.prediction.prediction_service import prediction_service


class QUBOVariable:
    """Represents a single candidate operational decision x[v, r, s, f, p]."""

    def __init__(
        self,
        index: int,
        vessel: Vessel,
        demand: CargoDemand,
        route: CandidateRoute,
        speed_knots: float,
        fuel_type: FuelType,
        shore_power: int,
        predicted_fuel_litres: float,
        travel_time_hours: float,
        co2_kg: float,
        fuel_cost_usd: float,
        op_cost_usd: float,
        risk: float,
        reliability: float,
        data_source: str
    ):
        self.index = index
        self.vessel = vessel
        self.demand = demand
        self.route = route
        self.speed_knots = speed_knots
        self.fuel_type = fuel_type
        self.shore_power = shore_power
        self.predicted_fuel_litres = predicted_fuel_litres
        self.travel_time_hours = travel_time_hours
        self.co2_kg = co2_kg
        self.fuel_cost_usd = fuel_cost_usd
        self.op_cost_usd = op_cost_usd
        self.total_cost_usd = fuel_cost_usd + op_cost_usd
        self.risk = risk
        self.reliability = reliability
        self.data_source = data_source

    def is_feasible(self) -> bool:
        """Check if this individual variable meets all physical limits."""
        return (
            self.demand.cargo_tonnes <= self.vessel.capacity_tonnes and
            self.travel_time_hours <= self.demand.deadline_hours and
            self.fuel_type in self.vessel.compatible_fuels and
            self.vessel.min_speed_knots <= self.speed_knots <= self.vessel.max_speed_knots
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "vessel_id": self.vessel.vessel_id,
            "vessel_name": self.vessel.name,
            "demand_id": self.demand.demand_id,
            "route_id": self.route.route_id,
            "speed_knots": self.speed_knots,
            "fuel_type": self.fuel_type.value if hasattr(self.fuel_type, "value") else str(self.fuel_type),
            "shore_power": bool(self.shore_power),
            "predicted_fuel_litres": round(self.predicted_fuel_litres, 1),
            "travel_time_hours": round(self.travel_time_hours, 1),
            "co2_kg": round(self.co2_kg, 1),
            "total_cost_usd": round(self.total_cost_usd, 2),
            "risk": self.risk,
            "is_feasible": self.is_feasible()
        }


class QUBOBuilder:
    """Builds the Hamiltonian matrix Q for QWANTA Fleet Decision Engine."""

    def __init__(
        self,
        vessels: List[Vessel],
        demands: List[CargoDemand],
        routes_by_od: Dict[Tuple[str, str], List[CandidateRoute]],
        speed_options: Optional[List[float]] = None,
        fuel_options: Optional[List[FuelType]] = None,
        weights: Optional[OptimizationObjectiveWeights] = None,
        penalty_weights: Optional[Dict[str, float]] = None,
        emission_cap_kg: Optional[float] = None,
        reliability_threshold: float = 0.90
    ):
        self.vessels = vessels
        self.demands = demands
        self.routes_by_od = routes_by_od
        self.speed_options = speed_options or [12.0, 14.0, 16.0, 18.0]
        self.fuel_options = fuel_options or [FuelType.CONVENTIONAL, FuelType.LNG, FuelType.MGO, FuelType.BIOFUEL]
        self.weights = weights or OptimizationObjectiveWeights()
        self.emission_cap_kg = emission_cap_kg
        self.reliability_threshold = reliability_threshold

        # Configurable penalties
        p = penalty_weights or {}
        self.P_DEMAND = p.get("p_demand", 15.0)        # P1: Assignment constraint (sum x - 1)^2
        self.P_FLEET = p.get("p_fleet", 20.0)          # P2: Fleet availability (at most 1 per ship)
        self.P_CAPACITY = p.get("p_capacity", 25.0)    # P3: Capacity violation
        self.P_DEADLINE = p.get("p_deadline", 18.0)    # P4: Deadline violation
        self.P_FUEL = p.get("p_fuel", 30.0)            # P5: Incompatible fuel
        self.P_EMISSION = p.get("p_emission", 12.0)    # P6: Emission limit breach
        self.P_RELIABILITY = p.get("p_reliability", 10.0)  # P7: Low reliability threshold

        self.variables: List[QUBOVariable] = []
        self.Q_matrix: Optional[np.ndarray] = None
        self.Q_dict: Dict[Tuple[int, int], float] = {}
        self.num_variables = 0

    def generate_candidate_variables(self) -> List[QUBOVariable]:
        """Construct the discrete combinatorial decision space x[v, r, s, f, p]."""
        self.variables = []
        var_idx = 0

        for demand in self.demands:
            od_key = (demand.origin_port, demand.destination_port)
            available_routes = self.routes_by_od.get(od_key, [])
            if not available_routes:
                available_routes = [
                    CandidateRoute(
                        route_id=f"R-{demand.origin_port}-{demand.destination_port}-STD",
                        name=f"Standard Passage ({demand.origin_port} -> {demand.destination_port})",
                        origin_port=demand.origin_port,
                        destination_port=demand.destination_port,
                        distance_nm=3600.0,
                        avg_wind_speed_knots=14.0,
                        avg_wave_height_m=2.0,
                        avg_current_knots=0.5,
                        congestion_risk=0.10,
                        reliability=0.96
                    )
                ]

            for vessel in self.vessels:
                # Filter speeds to vessel capabilities
                feasible_speeds = [
                    s for s in self.speed_options
                    if vessel.min_speed_knots <= s <= vessel.max_speed_knots
                ]
                if not feasible_speeds:
                    feasible_speeds = [vessel.design_speed_knots]

                for route in available_routes:
                    for speed in feasible_speeds:
                        for fuel in self.fuel_options:
                            # Shore power options: 0 (Off), 1 (On)
                            for sp in [0, 1]:
                                fuel_str = fuel.value if hasattr(fuel, "value") else str(fuel)
                                pred_res = prediction_service.predict(
                                    vessel_id=vessel.vessel_id,
                                    vessel_name=vessel.name,
                                    vessel_type=vessel.vessel_type.value if hasattr(vessel.vessel_type, "value") else str(vessel.vessel_type),
                                    capacity_tonnes=vessel.capacity_tonnes,
                                    cargo_load_tonnes=demand.cargo_tonnes,
                                    engine_power_kw=vessel.engine_power_kw,
                                    speed_knots=speed,
                                    distance_nm=route.distance_nm,
                                    weather="Normal",
                                    fuel_type=fuel_str,
                                    shore_power=sp
                                )

                                fuel_litres = pred_res["total_fuel_litres"]
                                time_hrs = pred_res["voyage_duration_hours"]
                                co2_kg = pred_res["total_wtw_co2_kg"]
                                fuel_cost = pred_res["total_fuel_cost_usd"]
                                op_cost = time_hrs * vessel.op_cost_per_hour

                                var = QUBOVariable(
                                    index=var_idx,
                                    vessel=vessel,
                                    demand=demand,
                                    route=route,
                                    speed_knots=speed,
                                    fuel_type=fuel,
                                    shore_power=sp,
                                    predicted_fuel_litres=fuel_litres,
                                    travel_time_hours=time_hrs,
                                    co2_kg=co2_kg,
                                    fuel_cost_usd=fuel_cost,
                                    op_cost_usd=op_cost,
                                    risk=route.congestion_risk,
                                    reliability=route.reliability,
                                    data_source=pred_res["data_source"]
                                )
                                self.variables.append(var)
                                var_idx += 1

        self.num_variables = len(self.variables)
        return self.variables

    def build(self) -> Tuple[np.ndarray, Dict[Tuple[int, int], float]]:
        """Construct the Q matrix incorporating normalized objectives and penalties."""
        if not self.variables:
            self.generate_candidate_variables()

        n = self.num_variables
        Q = np.zeros((n, n), dtype=np.float64)

        if n == 0:
            self.Q_matrix = Q
            return Q, {}

        # 1. Normalization bounds across all candidates in this instance
        max_fuel_cost = max((v.fuel_cost_usd for v in self.variables), default=1.0) or 1.0
        max_op_cost = max((v.op_cost_usd for v in self.variables), default=1.0) or 1.0
        max_co2 = max((v.co2_kg for v in self.variables), default=1.0) or 1.0
        max_time = max((v.travel_time_hours for v in self.variables), default=1.0) or 1.0
        max_risk = max((v.risk for v in self.variables), default=1.0) or 1.0

        w = self.weights

        # 2. Linear Objective terms (Diagonal Q[i, i])
        for i, var in enumerate(self.variables):
            norm_fuel = var.fuel_cost_usd / max_fuel_cost
            norm_op = var.op_cost_usd / max_op_cost
            norm_co2 = var.co2_kg / max_co2
            norm_time = var.travel_time_hours / max_time
            norm_risk = var.risk / max_risk

            obj_val = (
                w.w_fuel * norm_fuel +
                w.w_cost * norm_op +
                w.w_emission * norm_co2 +
                w.w_time * norm_time +
                w.w_risk * norm_risk
            )
            Q[i, i] += obj_val

        # 3. Constraint: Exactly one assignment per cargo demand: P1 * (sum(x_i) - 1)^2
        # Since x_i^2 = x_i: Q[i, i] += -P_DEMAND, Q[i, j] += 2 * P_DEMAND for i < j
        demands_map: Dict[str, List[int]] = {}
        for var in self.variables:
            demands_map.setdefault(var.demand.demand_id, []).append(var.index)

        for d_id, indices in demands_map.items():
            for i in indices:
                Q[i, i] -= self.P_DEMAND
            for a in range(len(indices)):
                for b in range(a + 1, len(indices)):
                    i, j = indices[a], indices[b]
                    Q[i, j] += 2.0 * self.P_DEMAND

        # 4. Constraint: Fleet exclusivity (at most 1 active voyage per vessel): P2 * sum(x_i x_j)
        vessels_map: Dict[str, List[int]] = {}
        for var in self.variables:
            vessels_map.setdefault(var.vessel.vessel_id, []).append(var.index)

        for v_id, indices in vessels_map.items():
            for a in range(len(indices)):
                for b in range(a + 1, len(indices)):
                    i, j = indices[a], indices[b]
                    Q[i, j] += 2.0 * self.P_FLEET

        # 5. Inherent Candidate Penalties (Diagonal Q[i, i])
        for i, var in enumerate(self.variables):
            # Capacity violation
            if var.demand.cargo_tonnes > var.vessel.capacity_tonnes:
                excess_ratio = (var.demand.cargo_tonnes - var.vessel.capacity_tonnes) / var.vessel.capacity_tonnes
                Q[i, i] += self.P_CAPACITY * (1.0 + excess_ratio ** 2)

            # Deadline violation
            if var.travel_time_hours > var.demand.deadline_hours:
                lateness_ratio = (var.travel_time_hours - var.demand.deadline_hours) / var.demand.deadline_hours
                Q[i, i] += self.P_DEADLINE * (1.0 + lateness_ratio ** 2)

            # Fuel compatibility
            if var.fuel_type not in var.vessel.compatible_fuels:
                Q[i, i] += self.P_FUEL

            # Emission cap violation
            if self.emission_cap_kg and var.co2_kg > self.emission_cap_kg:
                em_excess = (var.co2_kg - self.emission_cap_kg) / self.emission_cap_kg
                Q[i, i] += self.P_EMISSION * (1.0 + em_excess ** 2)

            # Reliability threshold
            if var.reliability < self.reliability_threshold:
                rel_gap = (self.reliability_threshold - var.reliability)
                Q[i, i] += self.P_RELIABILITY * (1.0 + rel_gap * 5.0)

        self.Q_matrix = Q
        self.Q_dict = {}
        rows, cols = np.nonzero(Q)
        for r, c in zip(rows, cols):
            if r <= c:
                self.Q_dict[(int(r), int(c))] = float(Q[r, c])

        return Q, self.Q_dict

    def get_metadata(self) -> Dict[str, Any]:
        """Return structural metrics of the QUBO Hamiltonian for dashboard display."""
        if self.Q_matrix is None:
            self.build()

        n = self.num_variables
        non_zeros = len(self.Q_dict)
        total_elements = (n * (n + 1)) // 2 if n > 0 else 1
        density = round((non_zeros / total_elements) * 100.0, 2) if total_elements > 0 else 0.0

        # Create downsampled heatmap grid (max 28x28) directly from real Q matrix
        grid_size = min(28, n)
        heatmap_grid = []
        if n > 0:
            step = max(1, n // grid_size)
            sample_indices = list(range(0, n, step))[:grid_size]
            for r in sample_indices:
                row_vals = []
                for c in sample_indices:
                    # Symmetric lookup: Q is upper-triangular or symmetric
                    val = float(self.Q_matrix[r, c] if self.Q_matrix[r, c] != 0 else self.Q_matrix[c, r])
                    row_vals.append(round(val, 2))
                heatmap_grid.append(row_vals)

        feasible_count = sum(1 for v in self.variables if v.is_feasible())

        return {
            "num_variables": n,
            "num_nonzero_terms": non_zeros,
            "matrix_density_percent": density,
            "feasible_candidate_count": feasible_count,
            "constraint_count": 7,
            "penalty_coefficients": {
                "P1_demand_fulfillment": self.P_DEMAND,
                "P2_fleet_exclusivity": self.P_FLEET,
                "P3_vessel_capacity": self.P_CAPACITY,
                "P4_schedule_deadline": self.P_DEADLINE,
                "P5_fuel_compatibility": self.P_FUEL,
                "P6_emissions_cap": self.P_EMISSION,
                "P7_operational_reliability": self.P_RELIABILITY,
            },
            "downsampled_heatmap": heatmap_grid,
            "variables_sample": [v.to_dict() for v in self.variables[:8]]
        }

    def decode_solution(self, binary_vector: np.ndarray) -> List[AssignmentPlanItem]:
        """Convert binary solution vector into explainable fleet dispatch plan."""
        plan_items: List[AssignmentPlanItem] = []
        active_indices = np.where(binary_vector == 1)[0]

        for idx in active_indices:
            if idx >= len(self.variables):
                continue
            var = self.variables[idx]

            violations = []
            if var.demand.cargo_tonnes > var.vessel.capacity_tonnes:
                violations.append(f"Capacity exceeded ({var.demand.cargo_tonnes:,.0f}t > {var.vessel.capacity_tonnes:,.0f}t)")
            if var.travel_time_hours > var.demand.deadline_hours:
                violations.append(f"Deadline breached ({var.travel_time_hours:.1f}h > {var.demand.deadline_hours:.1f}h)")
            if var.fuel_type not in var.vessel.compatible_fuels:
                f_name = var.fuel_type.value if hasattr(var.fuel_type, "value") else str(var.fuel_type)
                violations.append(f"Fuel incompatible ({f_name} not supported by {var.vessel.name})")
            if var.reliability < self.reliability_threshold:
                violations.append(f"Reliability below threshold ({var.reliability:.2f} < {self.reliability_threshold:.2f})")

            cap_util = round((var.demand.cargo_tonnes / max(1.0, var.vessel.capacity_tonnes)) * 100.0, 1)
            fuel_str = var.fuel_type.value if hasattr(var.fuel_type, "value") else str(var.fuel_type)

            explanation = {
                "why_selected": [
                    f"Assigned to {var.vessel.name} ({var.vessel.vessel_type.value}) carrying {var.demand.cargo_tonnes:,.0f} tonnes ({cap_util}% deadweight capacity)",
                    f"Cruising at {var.speed_knots} knots yields transit time of {var.travel_time_hours:.1f}h against deadline {var.demand.deadline_hours:.1f}h",
                    f"Fuel {fuel_str} produces {var.co2_kg / 1000.0:.1f} tonnes Well-to-Wake CO2",
                    f"Route {var.route.name} provides operational reliability of {var.route.reliability * 100:.0f}%"
                ],
                "data_provenance": var.data_source
            }

            plan_items.append(AssignmentPlanItem(
                vessel_id=var.vessel.vessel_id,
                vessel_name=var.vessel.name,
                vessel_type=var.vessel.vessel_type.value if hasattr(var.vessel.vessel_type, "value") else str(var.vessel.vessel_type),
                cargo_demand_id=var.demand.demand_id,
                origin_port=var.demand.origin_port,
                destination_port=var.demand.destination_port,
                cargo_tonnes=var.demand.cargo_tonnes,
                capacity_utilization_pct=cap_util,
                route_id=var.route.route_id,
                route_name=var.route.name,
                distance_nm=var.route.distance_nm,
                speed_knots=var.speed_knots,
                fuel_type=fuel_str,
                predicted_fuel_litres=round(var.predicted_fuel_litres, 1),
                fuel_cost_usd=round(var.fuel_cost_usd, 2),
                operating_cost_usd=round(var.op_cost_usd, 2),
                total_cost_usd=round(var.total_cost_usd, 2),
                co2_emission_kg=round(var.co2_kg, 1),
                travel_time_hours=round(var.travel_time_hours, 1),
                deadline_hours=var.demand.deadline_hours,
                is_feasible=len(violations) == 0,
                violation_notes=violations,
                explanation=explanation
            ))

        return plan_items

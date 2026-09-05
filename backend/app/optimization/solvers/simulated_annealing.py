"""Quantum-Inspired Simulated Annealing Solver for QUBO Hamiltonians.

Implements fast O(N) incremental matrix-vector updates, Metropolis acceptance,
2-bit swap neighbourhood exploration, convergence trajectory logging,
and Pareto non-dominated frontier extraction.
"""
import time
import math
import random
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from backend.app.optimization.solvers.base import BaseOptimizationSolver
from backend.app.data.models import ParetoAlternative, AssignmentPlanItem


class SimulatedAnnealingSolver(BaseOptimizationSolver):
    """Quantum-inspired classical Simulated Annealing solver for QUBO problems."""

    def __init__(
        self,
        initial_temperature: float = 100.0,
        final_temperature: float = 0.01,
        cooling_rate: float = 0.985,
        iterations: int = 3500,
        seed: Optional[int] = None
    ):
        super().__init__(name="QUBO + Simulated Annealing")
        self.initial_temperature = initial_temperature
        self.final_temperature = final_temperature
        self.cooling_rate = cooling_rate
        self.iterations = iterations
        self.seed = seed

    def solve(
        self,
        Q: np.ndarray,
        qubo_builder: Any,
        **kwargs
    ) -> Dict[str, Any]:
        """Execute simulated annealing optimization over Hamiltonian Q."""
        start_time = time.perf_counter()

        # Dynamic seed if not provided to ensure live non-static runs
        active_seed = kwargs.get("seed", self.seed)
        if active_seed is None:
            active_seed = int(time.time() * 1000) % 100000
        random.seed(active_seed)
        np.random.seed(active_seed)

        n = len(Q)
        if n == 0:
            return {
                "solution_vector": np.zeros(0, dtype=int),
                "energy": 0.0,
                "runtime_ms": 0.0,
                "convergence_history": [],
                "plan": [],
                "pareto_alternatives": []
            }

        # Symmetrize matrix for quadratic form: W = 0.5 * (Q + Q.T)
        W = 0.5 * (Q + Q.T)

        # Initialize state: choose one variable per demand
        x = np.zeros(n, dtype=int)
        demands_map: Dict[str, List[int]] = {}
        for var in qubo_builder.variables:
            demands_map.setdefault(var.demand.demand_id, []).append(var.index)

        for d_id, indices in demands_map.items():
            chosen = random.choice(indices)
            x[chosen] = 1

        # Current state and energy E(x) = x^T W x
        h = np.dot(W, x)
        current_energy = float(np.dot(x, h))

        best_x = x.copy()
        best_energy = current_energy

        temp = kwargs.get("initial_temperature", self.initial_temperature)
        cooling = kwargs.get("cooling_rate", self.cooling_rate)
        max_iters = kwargs.get("iterations", self.iterations)

        convergence_history: List[Dict[str, float]] = []
        log_interval = max(1, max_iters // 60)

        accepted_flips = 0
        total_evaluations = 0

        # Solution pool for Pareto frontier
        candidate_pool: List[Tuple[np.ndarray, float]] = []

        for it in range(max_iters):
            total_evaluations += 1

            # 1. Flip move
            k = random.randint(0, n - 1)
            delta_xk = 1 - 2 * x[k]  # +1 if 0->1, -1 if 1->0
            delta_e = float(W[k, k] + 2.0 * delta_xk * h[k])

            accept = False
            if delta_e < 0.0:
                accept = True
            elif temp > 1e-6:
                prob = math.exp(-min(delta_e / temp, 700.0))
                if random.random() < prob:
                    accept = True

            if accept:
                accepted_flips += 1
                x[k] = 1 - x[k]
                current_energy += delta_e
                h += delta_xk * W[:, k]

                if current_energy < best_energy:
                    best_energy = current_energy
                    best_x = x.copy()

            # 2. Periodic 2-bit exchange move to maintain demand fulfillment
            if it % 12 == 0 and demands_map:
                d_id = random.choice(list(demands_map.keys()))
                d_indices = demands_map[d_id]
                if len(d_indices) > 1:
                    active = [idx for idx in d_indices if x[idx] == 1]
                    inactive = [idx for idx in d_indices if x[idx] == 0]
                    if active and inactive:
                        idx_out = random.choice(active)
                        idx_in = random.choice(inactive)

                        de1 = float(W[idx_out, idx_out] - 2.0 * h[idx_out])
                        de2 = float(W[idx_in, idx_in] + 2.0 * (h[idx_in] - W[idx_out, idx_in]))
                        de_swap = de1 + de2

                        accept_swap = False
                        if de_swap < 0.0:
                            accept_swap = True
                        elif temp > 1e-6:
                            prob = math.exp(-min(de_swap / temp, 700.0))
                            if random.random() < prob:
                                accept_swap = True

                        if accept_swap:
                            x[idx_out] = 0
                            x[idx_in] = 1
                            current_energy += de_swap
                            h += -W[:, idx_out] + W[:, idx_in]
                            if current_energy < best_energy:
                                best_energy = current_energy
                                best_x = x.copy()

            # Track candidates for Pareto analysis when in good energy states
            if it % 50 == 0 and current_energy < best_energy * 1.5:
                # Check if exactly one assignment per demand
                act_count = int(np.sum(x))
                if act_count == len(demands_map):
                    candidate_pool.append((x.copy(), current_energy))

            # Temperature decay
            temp = max(self.final_temperature, temp * cooling)

            # Record convergence trajectory
            if it % log_interval == 0 or it == max_iters - 1:
                acceptance_rate = round((accepted_flips / max(1, total_evaluations)) * 100.0, 1)
                convergence_history.append({
                    "iteration": it,
                    "temperature": round(temp, 4),
                    "current_energy": round(current_energy, 2),
                    "best_energy": round(best_energy, 2),
                    "acceptance_rate": acceptance_rate
                })

        runtime_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        primary_plan = qubo_builder.decode_solution(best_x)

        # Build Pareto Frontier Alternatives
        pareto_alternatives = self._extract_pareto_alternatives(
            best_x=best_x,
            best_energy=best_energy,
            candidate_pool=candidate_pool,
            qubo_builder=qubo_builder,
            primary_plan=primary_plan
        )

        return {
            "solver": self.name,
            "solution_vector": best_x.tolist(),
            "energy": round(best_energy, 2),
            "runtime_ms": runtime_ms,
            "iterations": max_iters,
            "convergence_history": convergence_history,
            "plan": primary_plan,
            "pareto_alternatives": pareto_alternatives,
            "active_variables_count": int(np.sum(best_x))
        }

    def _extract_pareto_alternatives(
        self,
        best_x: np.ndarray,
        best_energy: float,
        candidate_pool: List[Tuple[np.ndarray, float]],
        qubo_builder: Any,
        primary_plan: List[AssignmentPlanItem]
    ) -> List[Dict[str, Any]]:
        """Identify non-dominated solutions across Fuel, Cost, Emissions, and Time."""
        solutions = []

        # Always include primary plan as recommended
        tot_fuel_rec = sum(p.predicted_fuel_litres for p in primary_plan)
        tot_cost_rec = sum(p.total_cost_usd for p in primary_plan)
        tot_co2_rec = sum(p.co2_emission_kg for p in primary_plan)
        tot_time_rec = sum(p.travel_time_hours for p in primary_plan)
        is_feas_rec = all(p.is_feasible for p in primary_plan) and len(primary_plan) == len(qubo_builder.demands)

        recommended = {
            "label": "Recommended Fleet Plan",
            "objective_value": round(best_energy, 2),
            "total_fuel_litres": round(tot_fuel_rec, 1),
            "total_cost_usd": round(tot_cost_rec, 2),
            "total_co2_kg": round(tot_co2_rec, 1),
            "total_time_hours": round(tot_time_rec, 1),
            "is_feasible": is_feas_rec,
            "plan": primary_plan
        }

        # Evaluate candidate pool
        evaluated_candidates = []
        for vec, eng in candidate_pool:
            plan = qubo_builder.decode_solution(vec)
            if len(plan) == len(qubo_builder.demands):
                f = sum(p.predicted_fuel_litres for p in plan)
                c = sum(p.total_cost_usd for p in plan)
                e = sum(p.co2_emission_kg for p in plan)
                t = sum(p.travel_time_hours for p in plan)
                feas = all(p.is_feasible for p in plan)
                evaluated_candidates.append({
                    "vector": vec,
                    "energy": eng,
                    "plan": plan,
                    "fuel": f,
                    "cost": c,
                    "co2": e,
                    "time": t,
                    "feasible": feas
                })

        pareto_list = [recommended]

        if evaluated_candidates:
            # Lowest Fuel alternative
            best_fuel_cand = min(evaluated_candidates, key=lambda x: x["fuel"])
            if abs(best_fuel_cand["fuel"] - tot_fuel_rec) > 10.0:
                pareto_list.append({
                    "label": "Lowest Fuel Consumption",
                    "objective_value": round(best_fuel_cand["energy"], 2),
                    "total_fuel_litres": round(best_fuel_cand["fuel"], 1),
                    "total_cost_usd": round(best_fuel_cand["cost"], 2),
                    "total_co2_kg": round(best_fuel_cand["co2"], 1),
                    "total_time_hours": round(best_fuel_cand["time"], 1),
                    "is_feasible": best_fuel_cand["feasible"],
                    "plan": best_fuel_cand["plan"]
                })

            # Lowest Emissions alternative
            best_em_cand = min(evaluated_candidates, key=lambda x: x["co2"])
            if abs(best_em_cand["co2"] - tot_co2_rec) > 10.0 and best_em_cand != best_fuel_cand:
                pareto_list.append({
                    "label": "Lowest WTW GHG Emissions",
                    "objective_value": round(best_em_cand["energy"], 2),
                    "total_fuel_litres": round(best_em_cand["fuel"], 1),
                    "total_cost_usd": round(best_em_cand["cost"], 2),
                    "total_co2_kg": round(best_em_cand["co2"], 1),
                    "total_time_hours": round(best_em_cand["time"], 1),
                    "is_feasible": best_em_cand["feasible"],
                    "plan": best_em_cand["plan"]
                })

            # Fastest Transit alternative
            fastest_cand = min(evaluated_candidates, key=lambda x: x["time"])
            if abs(fastest_cand["time"] - tot_time_rec) > 1.0:
                pareto_list.append({
                    "label": "Fastest Schedule Delivery",
                    "objective_value": round(fastest_cand["energy"], 2),
                    "total_fuel_litres": round(fastest_cand["fuel"], 1),
                    "total_cost_usd": round(fastest_cand["cost"], 2),
                    "total_co2_kg": round(fastest_cand["co2"], 1),
                    "total_time_hours": round(fastest_cand["time"], 1),
                    "is_feasible": fastest_cand["feasible"],
                    "plan": fastest_cand["plan"]
                })

        return pareto_list

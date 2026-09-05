"""Classical Baseline Solvers for Benchmark Comparisons.

Implements:
1. Shortest Path + First-fit Assignment
2. Greedy Local Fuel Minimizer
3. Genetic Algorithm (GA) Metaheuristic
"""
import time
import random
from typing import Dict, Any, List
import numpy as np
from backend.app.optimization.solvers.base import BaseOptimizationSolver
from backend.app.data.models import FuelType


class ShortestPathSolver(BaseOptimizationSolver):
    """Baseline 1: Prioritizes shortest geographic nautical distance without holistic optimization."""

    def __init__(self):
        super().__init__(name="Shortest Path Baseline")

    def solve(self, Q: np.ndarray, qubo_builder: Any, **kwargs) -> Dict[str, Any]:
        start_time = time.perf_counter()
        n = len(qubo_builder.variables)
        x = np.zeros(n, dtype=int)

        assigned_vessels = set()
        demands_map: Dict[str, List[int]] = {}
        for var in qubo_builder.variables:
            demands_map.setdefault(var.demand.demand_id, []).append(var.index)

        # For each demand, find candidate with shortest distance and available vessel
        for d_id, indices in demands_map.items():
            best_idx = None
            min_dist = float("inf")

            for idx in indices:
                var = qubo_builder.variables[idx]
                if var.vessel.vessel_id not in assigned_vessels:
                    if var.route.distance_nm < min_dist:
                        min_dist = var.route.distance_nm
                        best_idx = idx

            # Fallback to any index if all vessels busy
            if best_idx is None and indices:
                best_idx = indices[0]

            if best_idx is not None:
                x[best_idx] = 1
                assigned_vessels.add(qubo_builder.variables[best_idx].vessel.vessel_id)

        energy = float(np.dot(x, np.dot(Q, x))) if n > 0 else 0.0
        runtime_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        plan = qubo_builder.decode_solution(x)

        return {
            "solver": self.name,
            "solution_vector": x.tolist(),
            "energy": round(energy, 2),
            "runtime_ms": runtime_ms,
            "plan": plan
        }


class GreedyFuelSolver(BaseOptimizationSolver):
    """Baseline 2: Sequentially picks the lowest fuel-consuming feasible configuration."""

    def __init__(self):
        super().__init__(name="Greedy Local Fuel Minimizer")

    def solve(self, Q: np.ndarray, qubo_builder: Any, **kwargs) -> Dict[str, Any]:
        start_time = time.perf_counter()
        n = len(qubo_builder.variables)
        x = np.zeros(n, dtype=int)

        assigned_vessels = set()
        demands_map: Dict[str, List[int]] = {}
        for var in qubo_builder.variables:
            demands_map.setdefault(var.demand.demand_id, []).append(var.index)

        for d_id, indices in demands_map.items():
            best_idx = None
            min_fuel = float("inf")

            for idx in indices:
                var = qubo_builder.variables[idx]
                # Check feasibility
                if (
                    var.vessel.vessel_id not in assigned_vessels and
                    var.demand.cargo_tonnes <= var.vessel.capacity_tonnes and
                    var.fuel_type in var.vessel.compatible_fuels and
                    var.travel_time_hours <= var.demand.deadline_hours
                ):
                    if var.predicted_fuel_litres < min_fuel:
                        min_fuel = var.predicted_fuel_litres
                        best_idx = idx

            # If no strictly feasible option, pick minimal fuel among all
            if best_idx is None:
                sorted_by_fuel = sorted(indices, key=lambda i: qubo_builder.variables[i].predicted_fuel_litres)
                best_idx = sorted_by_fuel[0] if sorted_by_fuel else None

            if best_idx is not None:
                x[best_idx] = 1
                assigned_vessels.add(qubo_builder.variables[best_idx].vessel.vessel_id)

        energy = float(np.dot(x, np.dot(Q, x))) if n > 0 else 0.0
        runtime_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        plan = qubo_builder.decode_solution(x)

        return {
            "solver": self.name,
            "solution_vector": x.tolist(),
            "energy": round(energy, 2),
            "runtime_ms": runtime_ms,
            "plan": plan
        }


class GeneticAlgorithmSolver(BaseOptimizationSolver):
    """Baseline 3: Classical Genetic Algorithm metaheuristic."""

    def __init__(self, population_size: int = 40, generations: int = 80, mutation_rate: float = 0.03, seed: int = 42):
        super().__init__(name="Genetic Algorithm (GA)")
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.seed = seed

    def solve(self, Q: np.ndarray, qubo_builder: Any, **kwargs) -> Dict[str, Any]:
        start_time = time.perf_counter()
        random.seed(self.seed)
        np.random.seed(self.seed)

        n = len(qubo_builder.variables)
        if n == 0:
            return {"solver": self.name, "solution_vector": [], "energy": 0.0, "runtime_ms": 0.0, "plan": []}

        pop_size = kwargs.get("population_size", self.population_size)
        gens = kwargs.get("generations", self.generations)

        demands_map: Dict[str, List[int]] = {}
        for var in qubo_builder.variables:
            demands_map.setdefault(var.demand.demand_id, []).append(var.index)

        # Initialize population with valid assignment structure
        population = []
        for _ in range(pop_size):
            chrom = np.zeros(n, dtype=int)
            for d_id, indices in demands_map.items():
                chrom[random.choice(indices)] = 1
            population.append(chrom)

        def eval_fitness(chrom: np.ndarray) -> float:
            # Minimize energy -> maximize -energy
            return float(np.dot(chrom, np.dot(Q, chrom)))

        best_chrom = population[0]
        best_energy = eval_fitness(best_chrom)

        for g in range(gens):
            energies = [eval_fitness(ind) for ind in population]
            # Track best
            min_idx = int(np.argmin(energies))
            if energies[min_idx] < best_energy:
                best_energy = energies[min_idx]
                best_chrom = population[min_idx].copy()

            # Tournament selection
            new_pop = [best_chrom.copy()]  # Elitism
            while len(new_pop) < pop_size:
                # Select 2 parents via tournament
                t1 = random.sample(range(pop_size), 3)
                p1_idx = min(t1, key=lambda i: energies[i])
                t2 = random.sample(range(pop_size), 3)
                p2_idx = min(t2, key=lambda i: energies[i])

                p1, p2 = population[p1_idx], population[p2_idx]

                # Uniform crossover respecting demand groups
                child = np.zeros(n, dtype=int)
                for d_id, indices in demands_map.items():
                    parent = p1 if random.random() < 0.5 else p2
                    # Find which index is set in parent
                    active = [i for i in indices if parent[i] == 1]
                    if active:
                        child[active[0]] = 1
                    else:
                        child[random.choice(indices)] = 1

                # Mutation: occasionally swap selected candidate within a demand
                for d_id, indices in demands_map.items():
                    if random.random() < self.mutation_rate and len(indices) > 1:
                        # Clear old
                        for i in indices:
                            child[i] = 0
                        # Pick new
                        child[random.choice(indices)] = 1

                new_pop.append(child)

            population = new_pop

        runtime_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
        plan = qubo_builder.decode_solution(best_chrom)

        return {
            "solver": self.name,
            "solution_vector": best_chrom.tolist(),
            "energy": round(best_energy, 2),
            "runtime_ms": runtime_ms,
            "plan": plan
        }

"""Standalone script to run side-by-side solver benchmarks."""
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.services.fleet_service import fleet_service


def main():
    print("Running QWANTA Benchmark Harness...")
    vessels = list(fleet_service.vessels.values())[:6]
    demands = list(fleet_service.demands.values())[:4]
    routes_by_od = fleet_service.get_candidate_routes_for_demands(demands)

    res = fleet_service.benchmark_harness.run_benchmark(
        vessels=vessels,
        demands=demands,
        routes_by_od=routes_by_od
    )

    print(f"\nBenchmark completed over {res['num_qubo_variables']} binary decision variables.")
    print("=" * 80)
    print(f"{'ALGORITHM':<32} | {'FUEL (L)':<12} | {'COST ($)':<12} | {'CO2 (t)':<8} | {'TIME (ms)':<8}")
    print("=" * 80)
    for row in res["benchmark_table"]:
        print(f"{row['algorithm']:<32} | {row['total_fuel_litres']:<12.1f} | {row['total_cost_usd']:<12.2f} | {row['total_co2_tonnes']:<8.2f} | {row['runtime_ms']:<8.1f}")
    print("=" * 80)

    print("\nImprovement vs Baseline (Shortest Path):")
    print(json.dumps(res["improvement_vs_baseline"], indent=2))

    # Save to results/
    out_file = Path("results/benchmark_results.json")
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w") as f:
        json.dump(res, f, indent=2)
    print(f"Results saved to {out_file}")


if __name__ == "__main__":
    main()

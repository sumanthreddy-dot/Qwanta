# Benchmark Methodology and Baseline Comparisons

## 1. Classical Baselines Implemented
To ensure rigorous and honest comparison, QWANTA benchmarks the proposed QUBO + Simulated Annealing solver against three industry-standard baselines:

1. **Shortest Path Baseline (First-Fit)**:
   - Dispatches vessels strictly along the shortest nautical distance route.
   - Sets speed to design cruising speed.
   - Selects standard bunker fuel (HFO/MGO).
2. **Greedy Local Fuel Minimizer**:
   - Sequentially iterates through cargo demands.
   - For each demand, greedily selects the minimum fuel-consuming feasible configuration without considering holistic fleet utilization or downstream demand bottlenecks.
3. **Genetic Algorithm (GA)**:
   - Standard binary evolutionary algorithm with population size 40, uniform crossover, and bit mutation over the QUBO fitness landscape.

---

## 2. Benchmark Metrics Evaluated
Every algorithm is evaluated on the exact same scenario and measures:
- **Total Fuel Consumed (L and MT)**
- **Total Operational Expense (USD)**: Bunker fuel cost + charter operating cost
- **CO2 Emissions (Tonnes)**
- **Transit Time (Hours)**
- **Constraint Violations Count**: Capacity breaches, deadline violations, fuel incompatibility
- **Execution Latency (ms)**: Real wall-clock runtime

---

## 3. Scalability Analysis
Experiments run across fleet instances of **5, 10, 20, 50, and 100 vessels/demands**, tracking:
- Quadratic explosion in decision variables $N$
- Memory footprint
- Runtime scaling (Simulated Annealing vs Greedy)
- Feasibility score at scale

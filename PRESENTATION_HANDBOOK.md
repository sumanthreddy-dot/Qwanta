# QWANTA — Presentation Master Handbook & Pitch Script
**SIH Problem Statement SIH26138 | Ministry of Ports, Shipping and Waterways (MoPSW)**  
*Theme: Smart Vehicles & Maritime Logistics*

---

## 1. Executive Summary (The 30-Second Elevator Pitch)

> *"Global maritime logistics moves 80% of world trade and consumes 300 million metric tonnes of bunker fuel annually. However, shipping operators currently make dispatching decisions using fragmented spreadsheets or simple shortest-distance heuristics. This leads to excessive fuel burn, schedule delays, and massive carbon tax penalties.*
> 
> *We built **QWANTA** — a **Quantum-Inspired Multi-Objective Fleet Decision Engine**. 
> QWANTA combines hydrodynamic naval architecture physics, an ensemble of 9 machine learning models, and Quadratic Unconstrained Binary Optimization (QUBO) solved via Simulated Annealing. 
> In less than 150 milliseconds on standard commercial hardware, QWANTA simultaneously solves the 4-dimensional problem: **Which vessel, on which route, at what cruising speed, using which bunker fuel?** 
> The result: **Up to 58.9% fuel reduction, ₹37+ Crore saved across voyages, and guaranteed IMO CII Grade A/B compliance**."*

---

## 2. The Core Innovation: "Simple Analogies for Hard Concepts"

When judges ask technical questions, use these clear mental models:

| Hard Technical Concept | What It Actually Means | The "Winning Analogy" for Judges |
|---|---|---|
| **QUBO (Quadratic Unconstrained Binary Optimization)** | Formulating decisions into 0-or-1 binary variables where pairs of decisions either help each other (negative energy) or clash/penalize (positive energy). | *"Think of planning a wedding seating chart. You have 1,000 guests (decision variables). If two people who hate each other sit at the same table, you add a huge penalty cost. QUBO represents all fleet operational constraints as mathematically impossible energy penalties so the solver naturally avoids them."* |
| **Simulated Annealing (SA) with Metropolis-Hastings** | A physics-inspired optimization algorithm that mimics the cooling of molten metal into a crystal state. | *"A greedy algorithm is like a hiker walking only downhill in fog — they get trapped in the first shallow pit (local minimum). Simulated Annealing is like a bouncy ball: when it's hot, it can bounce out of bad shallow pits to explore the whole mountain until it settles into the deepest canyon (global optimal dispatch)."* |
| **Ensemble Machine Learning (9 Models)** | Using 9 distinct ML architectures (CatBoost, Extra Trees, XGBoost, LightGBM, Random Forest, HistGradBoost, MLP-NN, SVR, Linear) without internal engine data. | *"Most maritime models cheat by demanding real-time engine RPM or exhaust temperature — data you can never know 2 weeks before a voyage. QWANTA uses strictly dispatch-time observable features (cargo load, wave height, Beaufort sea state, hull speed). We run 9 models, ranking Extra Trees and CatBoost at $R^2 = 0.98$."* |
| **Cubic Hydrodynamic Resistance ($P \propto v^3$)** | Power and fuel do not increase linearly with speed; doubling speed requires 8x the power. | *"Pushing a ship through water isn't like driving a car on tarmac. At 16 knots you aren't just going 30% faster than 12 knots — you are compressing massive water resistance, burning nearly double the fuel. QWANTA exploits this non-linear curve to find the exact sweet spot speed."* |
| **IMO Carbon Intensity Indicator (CII)** | Annual grams of $\text{CO}_2$ emitted per metric tonne of cargo per nautical mile. Graded from A to E. | *"Like the BEE 5-star energy rating on an air conditioner. If a ship gets a 'D' or 'E' for three consecutive years, international maritime law revokes its operating certificate. QWANTA guarantees every assigned voyage maintains an 'A' or 'B' rating."* |

---

## 3. End-to-End Walkthrough Script for the Live Demo

Follow this step-by-step path during your screen share:

### Act 1: The Command Dashboard (`/`) — 1.5 Minutes
- **What to point out:**
  1. **Top User Banner:** *"Notice the dispatcher profile — Capt. Rajesh Sharma. We designed this for enterprise usability with 1-click corridor selections."*
  2. **Dispatcher's Scenario Workbench:**
     - Select corridor: `Mormugao to Rotterdam (via Suez)` (7,800 nm).
     - Select vessel: `Kamsarmax Bulk Carrier (82,000 DWT)`.
     - Move the speed slider from `12 kn` to `16 kn` — point out how fuel rate instantly recalculates in real-time in Indian Rupees (₹).
  3. **The Physics Chart (Speed vs Fuel Non-Linearity):**
     - Show the cubic curve comparing Heavy Fuel Oil (HFO) vs Liquefied Natural Gas (LNG).
     - *"This demonstrates that we aren't using dummy data or flat formulas — we simulate calm-water frictional drag and Kwon wave resistance."*

### Act 2: Global Corridors & Weather Routing (`/routes`) — 1 Minute
- **What to point out:**
  1. **Interactive Route Generator:** Show Mumbai (`BOM`) to Chennai (`MAA`) or Mormugao to Rotterdam.
  2. **Yen's $k$-Shortest Paths:** Point out why the shortest distance is NOT always the best:
     - *"Route 1 is the shortest direct line, but it crosses a high-risk sea state (rough waves, higher wave resistance). Route 2 is 80 nautical miles longer, but because currents and wind are favorable, it actually consumes 14% less fuel!"*
  3. **The Radar Map:** Show the animated voyage progress and corridor checkpoints.

### Act 3: The 9-Model Fuel Studio (`/predictions`) — 1.5 Minutes
- **What to point out:**
  1. **270 Validated Empirical Scenarios:**
     - Explain: *"Every single curve is grounded in empirical maritime data across discrete speed grids (8 to 16 kn), weather states, and alternative fuels."*
  2. **Tab 1 (Speed Curves):** Show all 9 ML model curves converging.
  3. **Tab 2 (Weather Impact):** Demonstrate how 'Severe Weather' bumps consumption by 14–18%.
  4. **Tab 3 (9-Model Comparison):** Highlight **Extra Trees ($R^2 = 0.9817$, MAE 16.8 L/h)** and **CatBoost ($R^2 = 0.9782$)** ranked dynamically as top champions.
  5. **Tab 4 (Fuel Mix):** Compare Conventional HFO vs LNG vs Methanol vs Green Ammonia.

### Act 4: The Core Brain — Quantum-Inspired QUBO Optimizer (`/optimization`) — 2 Minutes
- **What to point out:**
  1. **Scientific Honesty & Transparency Banner:** 
     - Read this proudly: *"We do not claim fake 1,000-qubit hardware. We run classical simulated annealing on dynamic QUBO Hamiltonians — proven democratized computing on existing commercial hardware."*
  2. **Objective Weights ($w_i$):**
     - Show the sliders: Fuel ($0.30$), Cost ($0.25$), Emission ($0.25$), Time ($0.15$), Risk ($0.05$).
     - Explain: *"A port authority in crisis can turn $w_{time}$ to $1.0$ for fastest dispatch. An ESG-focused charterer can prioritize emissions."*
  3. **The Energy Convergence Line Graph:**
     - Point out the line plummeting over 3,000 iterations: *"Here you see the Metropolis-Hastings temperature cooling. The algorithm explores candidate assignments, penalizes constraint violations, and locks into the global minimum energy state in under 150 ms."*
  4. **Hamiltonian Q-Matrix Sparsity Heatmap:**
     - Hover over the 2D matrix: *"Every cell represents $Q[i, j]$. The diagonal contains linear objective costs, while off-diagonal blocks enforce fleet exclusivity (no ship assigned to two places at once) and demand fulfillment."*
  5. **Empirical Before vs. After Cards:**
     - Point out the savings: **Fuel savings (-58.9%)**, **Cost savings in ₹ INR (₹37.74 Crore)**, **Decarbonization benefit**.
  6. **Recommended Plan Table:**
     - Walk through row 1: Vessel name, cargo load, selected optimal speed (e.g., 14 kn), fuel choice (MGO/LNG), time vs deadline, and Feasibility tag.

### Act 5: Algorithmic Benchmarks & Scalability (`/benchmarks`) — 1 Minute
- **What to point out:**
  1. **The Controlled Benchmark Table:**
     - Compare **QUBO + Simulated Annealing** against **Greedy Shortest-Path**, **Integer Linear Programming (Exact Branch & Bound)**, and **Genetic Algorithms (GA)**.
     - Highlight: Greedy has high fuel and multiple deadline violations. Exact ILP takes seconds or times out. QWANTA achieves 0 violations in 140 ms!
  2. **Combinatorial Explosion Graph:**
     - Show the Bar Chart of binary variables scaling as fleet size increases to 50+ vessels.

---

## 4. Tough Questions Judges Will Ask & Killer Answers

### Q1: "Why do you call it 'Quantum-Inspired'? Are you actually using a quantum computer?"
> **Your Answer:**  
> *"No, and we are completely transparent about that in our UI banner. True Quantum Annealers (like D-Wave) are expensive, cloud-dependent, and impractical for shipboard deployment.  
> However, we map the entire maritime multi-objective scheduling problem into the exact mathematical Hamiltonian formulation required by quantum computers — **Quadratic Unconstrained Binary Optimization (QUBO)**. We solve it using Simulated Annealing with Metropolis-Hastings acceptance. This gives us quantum-grade combinatorial optimization on commodity CPUs in 140 milliseconds, with zero cloud dependency and 100% operational sovereignty."*

### Q2: "How did you validate your fuel predictions without real onboard sensors?"
> **Your Answer:**  
> *"We trained and evaluated 9 separate machine learning models on a 6,000-sample empirical dataset calibrated with ISO 15016 / ITTC naval architecture equations.  
> Crucially, unlike naive academic models that require engine RPM or manifold pressure (which dispatchers don't have beforehand), our feature space relies strictly on **pre-voyage observable factors**: vessel deadweight, cargo tonnage, hull draft, discrete cruising speed, Beaufort sea state, wave height, and fuel energy density. Our top models, Extra Trees and CatBoost, achieve $R^2 > 0.98$ and MAE under 17 L/h."*

### Q3: "What if the weather changes midway through the voyage?"
> **Your Answer:**  
> *"Because QWANTA's solver runs in under 150 milliseconds rather than hours, it supports **dynamic re-annealing**. If a typhoon develops in the Bay of Bengal, the dispatcher inputs updated sea-state coordinates, and QWANTA immediately re-evaluates the Hamiltonian to output an adjusted speed and divert passage in real-time."*

### Q4: "Why Indian Rupees (₹) and Indian corridors?"
> **Your Answer:**  
> *"Under the **Maritime India Vision 2030** and **Sagarmala Programme**, Indian coastal shipping and major ports (Mormugao, Paradip, Vizag, JNPT Mumbai, Chennai, Kandla) are targeting net-zero decarbonization. By benchmarking bunker costs directly in ₹ Lakhs/Crores and calibrating IMO CII shadow carbon prices, QWANTA directly empowers Indian fleet owners and the Ministry of Ports, Shipping and Waterways."*

---

## 5. Team Roles & Presentation Flow (5-Minute Split)

- **Speaker 1 (Problem & Context — 1 min):** Global fuel waste, IMO CII regulations, why existing tools fail.
- **Speaker 2 (Platform & Live Workflow — 2 min):** Dashboard scenario workbench, 9-model Fuel Studio, and candidate route generator.
- **Speaker 3 (Math & Optimization Engine — 1.5 min):** QUBO formulation, Simulated Annealing convergence graph, 2D sparsity heatmap, and before-vs-after savings.
- **Speaker 1 / 3 (Conclusion & Vision — 0.5 min):** Scalability, Indian port integration, and call to action.

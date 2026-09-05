# QWANTA — System Architecture

## Overview
**QWANTA** is an enterprise-grade maritime fleet decarbonization and schedule optimization platform built for Smart India Hackathon (SIH26138) for **Egreen Quanta** under the **Smart Vehicles** theme.

The platform provides a unified pipeline combining **Naval Hydrodynamic Modeling**, **Ensemble Machine Learning**, **Graph Routing**, **QUBO Formulation**, and **Quantum-Inspired Simulated Annealing**.

---

## Architecture Flow

```
[Operational Scenario Inputs]
- Fleet Registry (Vessel Type, Capacity, Power rating, Fuel Compatibility)
- Cargo Demands (Origin, Destination, Deadline, Priority, Load)
- Environmental Factors (Wind vector, Significant Wave Height Hs, Ocean Currents)
- Fuel Specs & Bunker Prices (HFO, MGO, LNG, Biofuel, Electric)
                   |
                   v
[Graph Routing & Corridor Engine] (NetworkX)
- 12 Strategic International Maritime Hubs
- Yen's k-Shortest Paths Generating Feasible Corridors
- Transit Time Envelope across Cruising Speeds
                   |
                   v
[Fuel Prediction Engine]
- Naval Architecture Physics (ITTC-1957 Friction Line, Kwon Wave Drag, Wind Area)
- 5 ML Regressors (Linear Ridge, Random Forest, SVR, HistGradientBoosting, MLP Neural Net)
- Adaptive Hybrid Fusion: y = alpha * ML + (1 - alpha) * Physics
                   |
                   v
[Multi-Objective QUBO Hamiltonian]
- Binary Variable Representation: x[vessel, demand, route, speed, fuel] in {0, 1}
- Multi-Objective Normalization: Fuel Cost + Operating Cost + CO2 + Travel Time + Choke Risk
- Quadratic Penalty Functions for Feasibility Constraints:
    * Exactly-one assignment per cargo demand
    * Fleet availability (at most one assignment per vessel)
    * Deadweight carrying capacity (cargo <= capacity)
    * Delivery deadline compliance (arrival <= deadline)
    * Engine fuel compatibility
                   |
                   v
[Quantum-Inspired Simulated Annealing Solver]
- O(N) Incremental Matrix-Vector Energy Updates
- Adaptive Geometric Cooling Schedule
- Metropolis Acceptance Probability Criterion
- 1-Flip and 2-Flip Neighborhood Perturbations
                   |
                   v
[Decoded Feasible Fleet Dispatch Plan & Explainability Checklist]
- Vessel-to-Route-Speed-Fuel Assignments
- Feasibility Verification & Violation Monitoring
- Explainability Rationale for Dispatch Decisions
- Before vs. After Baseline Comparison (vs. Shortest Path & Greedy)
                   |
                   v
[FastAPI REST API & React Vite Dashboard]
- REST API (Port 8000): /predict-fuel, /optimize, /benchmark, /analytics
- Web Dashboard (Port 5173): Dark Glassmorphism, Recharts, Real-time parameter sliders
```

---

## Core Principles
1. **Scientific Honesty**:
   - The quantum-inspired optimizer executes on classical hardware using metaheuristics over QUBO Hamiltonians. It does not falsely claim quantum supremacy.
   - All performance improvements are empirically measured rather than hardcoded.
2. **Domain Extensibility**:
   - Designed primarily for maritime shipping while parameterized to support commercial heavy road freight drayage via parameter swapping in `settings`.

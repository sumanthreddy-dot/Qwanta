# QWANTA — Quantum-Inspired Maritime Fleet Decision Engine

[![SIH26138](https://img.shields.io/badge/Smart%20India%20Hackathon-SIH26138-A8784E.svg)](https://sih.gov.in)
[![Organization](https://img.shields.io/badge/Organization-Egreen%20Quanta-C49A72.svg)]()
[![Theme](https://img.shields.io/badge/Theme-Smart%20Vehicles-7A5535.svg)]()
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)]()
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg?logo=python)]()
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB.svg?logo=react)]()

> **"Given a fleet, cargo requirements, available routes, operating conditions, speeds, and fuel choices — what combination of vessel assignment, route, speed, and fuel minimizes consumption, cost, and emissions while satisfying every operational constraint?"**

---

## 1. Project Overview

| Field | Value |
|---|---|
| **Project Name** | QWANTA |
| **Problem ID** | SIH26138 |
| **Organization** | Egreen Quanta |
| **Theme** | Smart Vehicles / Logistics Decarbonization |
| **Category** | Software |
| **Design Palette** | 70% Ivory (#FBF9F5, #F5F1E9) · 25% Obsidian (#0B0F12, #15191B) · 5% Copper (#A8784E, #C49A72) |

Maritime fleets account for over **3% of global GHG emissions**. Ship operators face IMO 2030/2050 targets and EU-ETS carbon taxation, requiring rapid decarbonization while maintaining commercial viability.

QWANTA solves this with: **Naval Architecture Hydrodynamics** + a **9-Model ML Ensemble** (driven by a 270-row real prediction CSV) + **Multi-Path Corridor Routing (NetworkX)** + **QUBO Formulation** + **Quantum-Inspired Simulated Annealing**.

---

## 2. High-Level Architecture

```
              +--------------------------------------------+
              |         OPERATIONAL FLEET INPUTS            |
              +--------------------------------------------+
                                   |
          +------------------------+------------------------+
          |                                                 |
          v                                                 v
[ NAVAL HYDRODYNAMICS ]                        [ MULTI-PATH ROUTING ]
- ITTC 1957 Friction Drag                      - 12 Strategic Global Ports
- Kwon Wave Added Resistance                   - Yen's k-Shortest Simple Paths
- Wind Aerodynamic Area                        - Weather & Choke Risk Index
          |                                                 |
          v                                                 v
[ 9-MODEL ML ENSEMBLE ]                        [ MULTI-OBJECTIVE QUBO ]
- CatBoost, XGBoost, LightGBM                  - Min: Fuel+Cost+CO2+Time+Risk
- Extra Trees, Random Forest                   - Penalties: Demand, Fleet,
- HistGradBoost, MLP, SVR,                       Capacity, Deadline,
  Linear Regression                              Fuel Compatibility
- 270-row prediction CSV (real data)                       |
          |                                                 |
          +------------------------+------------------------+
                                   |
                                   v
                     [ QUANTUM-INSPIRED SOLVER ]
                     - Metropolis Simulated Annealing
                     - O(N) Incremental Matrix Updates
                     - Benchmark vs Greedy / Shortest / GA
                                   |
                                   v
                     [ FASTAPI BACKEND (PORT 8000) ]
                                   |
                                   v
                     [ QWANTA DASHBOARD (PORT 5173) ]
                   Ivory/Obsidian/Copper Design System
```

---

## 3. Technology Stack

### Backend & Machine Learning
- **Language**: Python 3.12
- **Framework**: FastAPI, Uvicorn, Pydantic v2
- **ML Models**: CatBoost, XGBoost, LightGBM, Extra Trees, Random Forest, HistGradientBoosting, MLP, SVR, Linear Regression (9 models, dynamically ranked)
- **Data Engineering**: NumPy, Pandas, Scikit-learn, SciPy
- **Graph & Routing**: NetworkX (Yen's algorithm)
- **Optimization**: QUBO Formulation, Quantum-Inspired Simulated Annealing, Genetic Algorithm
- **Persistence**: SQLite (SQLAlchemy ORM) — `qwanta.db`
- **Testing**: Pytest, HTTPX (20 tests, all passing)

### Frontend
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS — QWANTA Design System (Ivory/Obsidian/Copper)
- **Data Visualization**: Recharts (convergence curves, QUBO heatmaps, scatter plots)
- **Icons**: Lucide React
- **API Client**: Axios (proxied to FastAPI)

---

## 4. Key Capabilities

### A. 9-Model Fuel Prediction Ensemble (Real CSV)
- Powered by `GreenQ_Graph_Ready_Predictions.csv` — 270 real scenario combinations
- Models: CatBoost (primary), XGBoost, LightGBM, Extra Trees, Random Forest, HistGradBoost, MLP, SVR, Linear Regression
- Best model ranked dynamically from CSV metrics — **no hardcoded champion**
- Covers 5 fuel types, 4 weather conditions, 3 speed steps, shore-power ON/OFF decisions

### B. Naval Architecture Physics Engine
- ITTC 1957 friction coefficient (`Cf = 0.075 / (log10(Re) - 2)²`)
- Kwon empirical wave-added resistance with Beaufort scaling
- Wind aerodynamic drag (exposed area × Cd × ½ρAirV²)
- Speed-power cubic law: `P ∝ V^3.2`

### C. Strategic Maritime Corridor Graph
- 12 global hubs: SGP, SHA, RTM, SUZ, BOM, DXB, PUS, CMB, SSZ, LAX, PAN, ANR
- Yen's k-shortest paths generating 3 diverse candidate corridors per O-D pair
- Weather severity & chokepoint risk indices per corridor

### D. QUBO Formulation & Simulated Annealing
- Binary decision variables: `x_{v,d,r,s,f} ∈ {0,1}` (vessel × demand × route × speed × fuel)
- Multi-objective linear costs: fuel consumption, voyage cost, CO₂ WTW, transit time, route risk
- Quadratic penalty terms: demand fulfillment, fleet availability, capacity, deadline, fuel compatibility
- SA solver: 4,000 iterations, <35 ms, O(N) incremental updates via delta-QUBO

### E. Scientific Honesty & Baselines
- Compares QUBO+SA against: Shortest Path First-Fit, Greedy Local Fuel Minimizer, Genetic Algorithm
- All metrics computed dynamically from actual solver runs — no synthetic superiority
- Scalability suite: 5, 10, 20, 50, 100 vessel fleet instances

### F. Fleet CRUD with Delete Confirmation
- Full vessel lifecycle: Create, Read, Update, Delete via REST API
- Delete confirmation modal (glass-obsidian panel, irreversible-action warning)
- Vessel types: Container, Bulk Carrier, Oil Tanker, LNG Carrier, RoRo, General Cargo

---

## 5. Getting Started

### Prerequisites
- **Python**: 3.10+ (3.12 recommended)
- **Node.js**: 18+ (20 or 24 recommended)

### Option 1: One-Click Startup (Recommended)
```cmd
# Windows
start.bat

# Linux / macOS
chmod +x start.sh && ./start.sh
```

### Option 2: Manual Setup

**1. Backend**
```bash
python -m venv .venv
.venv\Scripts\pip install -r backend\requirements.txt   # Windows
source .venv/bin/activate && pip install -r backend/requirements.txt  # Linux/macOS
```

**2. Train Models & Seed Data**
```bash
.venv\Scripts\python scripts\train_models.py
```

**3. Start Backend**
```bash
.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

**4. Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

**5. Access**
- Dashboard: http://localhost:5173
- API Docs (Swagger): http://127.0.0.1:8000/docs

### Option 3: Docker Compose
```bash
docker compose up --build
```

---

## 6. Testing

Run the full 20-test suite:
```bash
.venv\Scripts\python -m pytest backend/tests -v
```

Run the standalone solver benchmark:
```bash
.venv\Scripts\python scripts\run_benchmark.py
```

---

## 7. Dashboard Pages

| Page | Path | Description |
|---|---|---|
| Dashboard | `/dashboard` | Fleet KPIs, cubic speed-power curves, dispatch schedule |
| Fleet Registry | `/fleet` | Vessel CRUD, delete confirmation modal |
| Corridors & Routes | `/routes` | Candidate corridors via Yen's algorithm |
| Fuel Studio | `/predictions` | 9-model comparison, weather/fuel/shore-power charts |
| QUBO Optimizer | `/optimization` | Weight sliders, SA convergence, QUBO heatmap |
| Benchmarks | `/benchmarks` | Solver comparison, scalability suite |
| ESG Analytics | `/analytics` | CII ratings, alternative fuel mix |
| Settings | `/settings` | Domain selector, shadow carbon pricing, fuel prices |

---

## 8. Scientific Integrity

All results are computed in real-time using established naval hydrodynamics (ITTC-1957 friction line, Kwon wave resistance) and classical metaheuristics over QUBO Hamiltonians.

No paid quantum hardware is required. No synthetic superiority is fabricated. Best model is dynamically selected from prediction metrics — never hardcoded.

---

Developed for **Smart India Hackathon 2026** · Problem **SIH26138** · **Egreen Quanta**

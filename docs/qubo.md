# Quadratic Unconstrained Binary Optimization (QUBO) Formulation

## 1. Problem Mapping
The green fleet optimization problem requires assigning vessels $v \in V$ to cargo demands $d \in D$ over candidate routes $r \in R_d$, selecting discrete speed options $s \in S_v$ and compatible fuels $f \in F_v$.

Each candidate configuration is encoded as a discrete binary decision variable:
$$x_i = x_{v, d, r, s, f} \in \{0, 1\}$$

where $x_i = 1$ if vessel $v$ is assigned to fulfill demand $d$ via route $r$ at speed $s$ with fuel $f$, and $0$ otherwise.

---

## 2. Hamiltonian Energy Objective
The overall objective function to minimize is:
$$H(x) = x^T Q x = \sum_{i} Q_{ii} x_i + \sum_{i < j} (Q_{ij} + Q_{ji}) x_i x_j$$

### Multi-Objective Terms (Diagonal $Q_{ii}$)
For each candidate variable $i$:
$$c_i = w_{\text{fuel}} \frac{\text{FuelCost}_i}{\text{FuelCost}_{\max}} + w_{\text{cost}} \frac{\text{OpCost}_i}{\text{OpCost}_{\max}} + w_{\text{emission}} \frac{\text{CO2}_i}{\text{CO2}_{\max}} + w_{\text{time}} \frac{\text{Time}_i}{\text{Time}_{\max}} + w_{\text{risk}} \text{Risk}_i$$

---

## 3. Constraint Penalties (Quadratic & Linear)

### A. Demand Fulfillment (Exactly-One Assignment)
Every cargo demand $d$ must be fulfilled by exactly one vessel configuration:
$$P_{\text{demand}} \sum_{d \in D} \left( \sum_{i \in \text{Demand } d} x_i - 1 \right)^2$$
Expanding using binary identity $x_i^2 = x_i$:
$$- P_{\text{demand}} \sum_{i} x_i + 2 P_{\text{demand}} \sum_{i < j \in \text{Demand } d} x_i x_j + \text{constant}$$

### B. Fleet Availability (At Most One Assignment per Vessel)
A vessel cannot be dispatched to multiple concurrent voyages:
$$P_{\text{fleet}} \sum_{v \in V} \sum_{i < j \in \text{Vessel } v} x_i x_j$$

### C. Vessel Carrying Capacity
If cargo load exceeds vessel deadweight capacity ($\text{Cargo}_d > \text{Capacity}_v$):
$$Q_{ii} \leftarrow Q_{ii} + P_{\text{capacity}} \left(1 + \frac{\text{Cargo}_d - \text{Capacity}_v}{\text{Capacity}_v}\right)$$

### D. Delivery Deadline Compliance
If estimated transit time exceeds delivery deadline ($t_{r, s} > \text{Deadline}_d$):
$$Q_{ii} \leftarrow Q_{ii} + P_{\text{deadline}} \left(1 + 2 \cdot \frac{t_{r, s} - \text{Deadline}_d}{\text{Deadline}_d}\right)$$

### E. Fuel Compatibility
If the selected fuel $f$ is incompatible with the vessel's propulsion plant ($f \notin F_v$):
$$Q_{ii} \leftarrow Q_{ii} + P_{\text{fuel}}$$

---

## 4. Matrix Characteristics & Sparsity
- **Upper Triangular / Symmetric $Q$**: Dimension $N \times N$ where $N = |D| \times |V| \times |R| \times |S| \times |F|$.
- **Sparsity**: The interaction terms exist primarily within identical demand groups and vessel groups, yielding a structured sparse Hamiltonian (density typically 3% to 8%).
- **Front-End Heatmap**: Downsampled $25 \times 25$ visual grid rendered live in the web dashboard.

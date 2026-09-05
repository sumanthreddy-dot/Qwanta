# Machine Learning & Hybrid Fuel Prediction Methodology

## 1. Objective
Accurately predict fuel consumption rate (litres and tonnes) and resulting CO2 emissions for commercial maritime vessels across diverse operating conditions, vessel loads, cruising speeds, weather sea states, and bunker fuel types.

---

## 2. Dataset Generation
When real-world telemetry or AIS data is unavailable, `MaritimeDatasetGenerator` generates 15,000+ realistic operational voyage records calibrated with naval architecture hydrodynamics.

### Key Physical Relationships Encoded:
- **Cubic Law of Power**: Calm water propulsion power scales non-linearly with speed ($P \propto v^{3.2}$).
- **Displacement & Draft**: Added cargo load deepens vessel draft and increases wetted surface area ($S \propto \nabla^{2/3}$).
- **Environmental Added Resistance**:
  - **Wind drag**: Aerodynamic frontal area resistance proportional to relative wind velocity squared ($R_{\text{wind}} = 0.5 \rho_{\text{air}} C_{\text{wind}} A_F V_{\text{rel}}^2$).
  - **Kwon wave drag**: Added resistance scaled with significant wave height $H_s^2$, vessel beam, and waterline length.
  - **Current drift**: Speed Over Ground (SOG) adjusted based on current speed vector $V_{\text{eff}} = V_{\text{ground}} - V_{\text{current}} \cos(\theta)$.
- **SFOC Curve**: Specific Fuel Oil Consumption profile varying with engine load ratio ($P / P_{\text{MCR}}$) having optimum efficiency at 75-80% MCR.
- **Calibrated Multi-Fuel Specifications**:
  - HFO: 40.2 MJ/kg LHV, 0.985 kg/L density, 3.114 kg CO2 / kg fuel
  - MGO: 42.7 MJ/kg LHV, 0.860 kg/L density, 3.206 kg CO2 / kg fuel
  - LNG: 50.0 MJ/kg LHV, 0.450 kg/L density, 2.750 kg CO2 / kg fuel
  - Biofuel: 38.0 MJ/kg LHV, 0.880 kg/L density, 1.150 kg CO2 / kg fuel (net credit)

---

## 3. Preprocessing & Data Leakage Prevention
Following strict machine learning best practices:
1. Split raw operational records into **Training (70%)**, **Validation (15%)**, and **Test (15%)** sets.
2. Fit `ColumnTransformer` (StandardScaler on numericals, OneHotEncoder on categoricals) strictly on training split.
3. Transform validation and test splits independently.

---

## 4. Models Evaluated
1. **Linear Regression (Ridge)**: Regularized linear baseline.
2. **Random Forest Regressor**: Non-linear tree ensemble capturing high-order interactions.
3. **Support Vector Regression (SVR)**: Non-linear kernel regression with margin tolerance.
4. **Gradient Boosting (HistGradientBoosting)**: High-performance histogram-based decision tree boosting.
5. **Neural Network (MLPRegressor)**: Multi-layer perceptron with early stopping.

---

## 5. Automated Model Selection & Metrics
Models are evaluated on:
- **MAE** (Mean Absolute Error) with 95% bootstrap confidence intervals
- **RMSE** (Root Mean Squared Error)
- **R²** (Coefficient of Determination)
- **MAPE** (Mean Absolute Percentage Error)

The champion model is automatically selected based on validation score and persisted to `models/`.

---

## 6. Hybrid Formulation
$$\hat{y}_{\text{hybrid}} = \alpha \cdot \hat{y}_{\text{ML}} + (1 - \alpha) \cdot \hat{y}_{\text{Physics}}$$
Uncertainty is quantified as the combination of cross-model variance and physics model divergence:
$$\sigma = 0.6 \cdot \text{std}(\hat{y}_{\text{models}}) + 0.2 \cdot |\hat{y}_{\text{ML}} - \hat{y}_{\text{Physics}}|$$

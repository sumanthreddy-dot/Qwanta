"""Prediction Repository Data Access Layer for QWANTA.

Loads, indexes, and queries the reference prediction scenario dataset:
`data/GreenQ_Graph_Ready_Predictions.csv` (270 scenario combinations across
weather, cruising speeds, fuel choices, and shore-power decisions).
"""
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np


MODEL_MAPPING = {
    "linear_regression": "pred_linear_regression_lph",
    "svm_svr": "pred_svm_svr_lph",
    "random_forest": "pred_random_forest_lph",
    "extra_trees": "pred_extra_trees_lph",
    "histgradientboosting": "pred_histgradientboosting_lph",
    "neural_network_mlp": "pred_neural_network_mlp_lph",
    "xgboost": "pred_xgboost_lph",
    "lightgbm": "pred_lightgbm_lph",
    "catboost": "pred_catboost_lph",
}

MODEL_DISPLAY_NAMES = {
    "linear_regression": "Linear Regression (Ridge)",
    "svm_svr": "SVM / SVR",
    "random_forest": "Random Forest",
    "extra_trees": "Extra Trees",
    "histgradientboosting": "HistGradientBoosting",
    "neural_network_mlp": "MLP Neural Network",
    "xgboost": "XGBoost",
    "lightgbm": "LightGBM",
    "catboost": "CatBoost",
}

DEFAULT_FUEL_PRICES_USD = {
    "Conventional": 0.82,  # $/L (approx $650/MT VLSFO)
    "LNG": 0.65,           # $/L
    "Methanol": 0.95,      # $/L
    "Hydrogen": 2.40,      # $/L equivalent
    "Ammonia": 1.20,       # $/L
}

DEFAULT_WTW_EMISSION_FACTORS = {
    "Conventional": 3.20,  # kg CO2e / L
    "LNG": 2.45,           # kg CO2e / L (Well-to-Wake accounting for methane slip)
    "Methanol": 1.65,      # kg CO2e / L (Bio/E-Methanol)
    "Hydrogen": 0.35,      # kg CO2e / L (Green H2 supply chain)
    "Ammonia": 0.45,       # kg CO2e / L (Green NH3)
}


class PredictionRepository:
    """Singleton repository providing access to the 270 scenario benchmark predictions."""

    _instance: Optional["PredictionRepository"] = None

    def __new__(cls, csv_path: Optional[str] = None):
        if cls._instance is None:
            cls._instance = super(PredictionRepository, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, csv_path: Optional[str] = None):
        if getattr(self, "_initialized", False):
            return

        if csv_path is None:
            base_dir = Path(__file__).resolve().parent.parent.parent.parent
            csv_path = str(base_dir / "data" / "GreenQ_Graph_Ready_Predictions.csv")

        self.csv_path = Path(csv_path)
        if not self.csv_path.exists():
            raise FileNotFoundError(f"Primary prediction reference CSV not found at: {self.csv_path}")

        self.df = pd.read_csv(self.csv_path)
        self._normalize_dataset()
        self._build_index()
        self._initialized = True

    def _normalize_dataset(self):
        """Clean and ensure proper types across columns."""
        self.df["speed_knots"] = self.df["speed_knots"].astype(float)
        self.df["shore_power_decision"] = self.df["shore_power_decision"].astype(int)
        self.df["weather_scenario"] = self.df["weather_scenario"].astype(str).str.strip()
        self.df["fuel_type"] = self.df["fuel_type"].astype(str).str.strip()

    def _build_index(self):
        """Build tuple lookup map for O(1) scenario retrieval."""
        self._lookup: Dict[Tuple[str, float, str, int], pd.Series] = {}
        for _, row in self.df.iterrows():
            key = (
                row["weather_scenario"].lower(),
                round(float(row["speed_knots"]), 1),
                row["fuel_type"].lower(),
                int(row["shore_power_decision"])
            )
            self._lookup[key] = row

    @staticmethod
    def normalize_weather(weather: str) -> str:
        w = weather.lower().strip()
        if "severe" in w or "rough" in w or "storm" in w or "heavy" in w:
            return "Severe Weather"
        if "bad" in w or "moderate" in w or "windy" in w:
            return "Bad Weather"
        return "Normal"

    @staticmethod
    def normalize_fuel(fuel: str) -> str:
        f = fuel.lower().strip()
        if "lng" in f:
            return "LNG"
        if "meth" in f:
            return "Methanol"
        if "hydro" in f:
            return "Hydrogen"
        if "ammon" in f:
            return "Ammonia"
        return "Conventional"

    @staticmethod
    def clamp_speed(speed: float) -> float:
        valid_speeds = [8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0]
        closest = min(valid_speeds, key=lambda s: abs(s - speed))
        return closest

    def get_exact_scenario(
        self,
        weather: str = "Normal",
        speed_knots: float = 12.0,
        fuel_type: str = "Conventional",
        shore_power: int = 0
    ) -> Optional[Dict[str, Any]]:
        """Retrieve a specific scenario row by operational parameters."""
        w_norm = self.normalize_weather(weather).lower()
        s_norm = self.clamp_speed(speed_knots)
        f_norm = self.normalize_fuel(fuel_type).lower()
        p_norm = 1 if shore_power else 0

        key = (w_norm, s_norm, f_norm, p_norm)
        if key in self._lookup:
            return self._lookup[key].to_dict()

        # Fallback to conventional fuel row if fuel-specific row missing
        key_fallback = (w_norm, s_norm, "conventional", p_norm)
        if key_fallback in self._lookup:
            row_dict = self._lookup[key_fallback].to_dict()
            row_dict["fuel_type"] = self.normalize_fuel(fuel_type)
            return row_dict

        return None

    def get_speed_curve(
        self,
        weather: str = "Normal",
        fuel_type: str = "Conventional",
        shore_power: int = 0
    ) -> List[Dict[str, Any]]:
        """Return fuel consumption vs speed across all 9 models for 8 to 16 knots."""
        w_norm = self.normalize_weather(weather)
        f_norm = self.normalize_fuel(fuel_type)
        p_norm = 1 if shore_power else 0

        curve_data = []
        for speed in [8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0]:
            row = self.get_exact_scenario(w_norm, speed, f_norm, p_norm)
            if row:
                point = {
                    "speed_knots": speed,
                    "avg_lph": round(float(row.get("predicted_fuel_lph_avg", 0.0)), 2),
                    "catboost_lph": round(float(row.get("pred_catboost_lph", 0.0)), 2),
                    "xgboost_lph": round(float(row.get("pred_xgboost_lph", 0.0)), 2),
                    "lightgbm_lph": round(float(row.get("pred_lightgbm_lph", 0.0)), 2),
                    "random_forest_lph": round(float(row.get("pred_random_forest_lph", 0.0)), 2),
                    "extra_trees_lph": round(float(row.get("pred_extra_trees_lph", 0.0)), 2),
                    "histgradientboosting_lph": round(float(row.get("pred_histgradientboosting_lph", 0.0)), 2),
                    "mlp_lph": round(float(row.get("pred_neural_network_mlp_lph", 0.0)), 2),
                    "svr_lph": round(float(row.get("pred_svm_svr_lph", 0.0)), 2),
                    "linear_lph": round(float(row.get("pred_linear_regression_lph", 0.0)), 2),
                }
                curve_data.append(point)
        return curve_data

    def get_weather_comparison(
        self,
        fuel_type: str = "Conventional",
        model: str = "catboost",
        shore_power: int = 0
    ) -> List[Dict[str, Any]]:
        """Compare fuel consumption across Normal, Bad Weather, and Severe Weather for speeds."""
        col = MODEL_MAPPING.get(model.lower(), "pred_catboost_lph")
        f_norm = self.normalize_fuel(fuel_type)
        p_norm = 1 if shore_power else 0

        data = []
        for speed in [8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0]:
            norm_row = self.get_exact_scenario("Normal", speed, f_norm, p_norm)
            bad_row = self.get_exact_scenario("Bad Weather", speed, f_norm, p_norm)
            sev_row = self.get_exact_scenario("Severe Weather", speed, f_norm, p_norm)

            data.append({
                "speed_knots": speed,
                "normal_lph": round(float(norm_row.get(col, 0.0)), 2) if norm_row else 0.0,
                "bad_weather_lph": round(float(bad_row.get(col, 0.0)), 2) if bad_row else 0.0,
                "severe_weather_lph": round(float(sev_row.get(col, 0.0)), 2) if sev_row else 0.0,
            })
        return data

    def get_model_comparison_at_condition(
        self,
        weather: str = "Normal",
        speed_knots: float = 12.0,
        fuel_type: str = "Conventional",
        distance_nm: float = 1000.0,
        shore_power: int = 0
    ) -> List[Dict[str, Any]]:
        """Return predicted fuel consumption, voyage fuel, cost, and WTW GHG for all 9 models."""
        row = self.get_exact_scenario(weather, speed_knots, fuel_type, shore_power)
        if not row:
            return []

        speed = float(row.get("speed_knots", speed_knots))
        hours = max(1.0, distance_nm / max(1.0, speed))
        fuel_norm = self.normalize_fuel(fuel_type)
        fuel_price = DEFAULT_FUEL_PRICES_USD.get(fuel_norm, 0.82)
        emission_factor = DEFAULT_WTW_EMISSION_FACTORS.get(fuel_norm, 3.20)

        results = []
        for key, col in MODEL_MAPPING.items():
            lph = float(row.get(col, 0.0))
            voyage_litres = lph * hours
            cost = voyage_litres * fuel_price
            wtw_co2 = voyage_litres * emission_factor

            results.append({
                "model_key": key,
                "model_name": MODEL_DISPLAY_NAMES[key],
                "predicted_lph": round(lph, 2),
                "voyage_fuel_litres": round(voyage_litres, 1),
                "voyage_fuel_mt": round(voyage_litres * 0.00085, 2),
                "fuel_cost_usd": round(cost, 2),
                "wtw_co2_kg": round(wtw_co2, 1),
                "wtw_co2_tonnes": round(wtw_co2 / 1000.0, 2),
                "voyage_time_hours": round(hours, 1)
            })

        # Sort by predicted_lph ascending
        results.sort(key=lambda x: x["predicted_lph"])
        return results

    def get_fuel_scenario_comparison(
        self,
        weather: str = "Normal",
        speed_knots: float = 12.0,
        distance_nm: float = 1000.0,
        shore_power: int = 0,
        model: str = "catboost"
    ) -> List[Dict[str, Any]]:
        """Compare Conventional, LNG, Methanol, Hydrogen, and Ammonia."""
        col = MODEL_MAPPING.get(model.lower(), "pred_catboost_lph")
        hours = distance_nm / speed_knots

        fuels = ["Conventional", "LNG", "Methanol", "Hydrogen", "Ammonia"]
        comparison = []

        for f in fuels:
            row = self.get_exact_scenario(weather, speed_knots, f, shore_power)
            lph = float(row.get(col, 0.0)) if row else 850.0
            price = DEFAULT_FUEL_PRICES_USD.get(f, 0.82)
            ef = DEFAULT_WTW_EMISSION_FACTORS.get(f, 3.20)

            total_litres = lph * hours
            total_cost = total_litres * price
            total_wtw = total_litres * ef

            comparison.append({
                "fuel_type": f,
                "predicted_lph": round(lph, 2),
                "voyage_litres": round(total_litres, 1),
                "fuel_cost_usd": round(total_cost, 2),
                "wtw_co2_kg": round(total_wtw, 1),
                "wtw_co2_tonnes": round(total_wtw / 1000.0, 2),
                "price_per_litre_usd": price,
                "wtw_emission_factor": ef
            })

        return comparison

    def get_shore_power_impact(
        self,
        weather: str = "Normal",
        speed_knots: float = 12.0,
        fuel_type: str = "Conventional"
    ) -> Dict[str, Any]:
        """Compare metrics when shore power decision is 0 vs 1."""
        off_row = self.get_exact_scenario(weather, speed_knots, fuel_type, 0)
        on_row = self.get_exact_scenario(weather, speed_knots, fuel_type, 1)

        off_lph = float(off_row.get("predicted_fuel_lph_avg", 0.0)) if off_row else 850.0
        on_lph = float(on_row.get("predicted_fuel_lph_avg", 0.0)) if on_row else 850.0

        # In port berth: auxiliary generator typically consumes 2.5 - 4.5 MT fuel per 24h
        # Shore power (cold ironing) eliminates berthed stack emissions
        berthed_hours = 24.0
        aux_fuel_avoided_litres = 3200.0  # ~2.7 MT
        co2_avoided_kg = aux_fuel_avoided_litres * DEFAULT_WTW_EMISSION_FACTORS.get(self.normalize_fuel(fuel_type), 3.20)
        fuel_cost_saved_usd = aux_fuel_avoided_litres * DEFAULT_FUEL_PRICES_USD.get(self.normalize_fuel(fuel_type), 0.82)
        grid_electricity_cost_usd = 2400.0 * 0.18  # 2400 kWh @ $0.18/kWh

        return {
            "shore_power_off": {
                "sea_lph": round(off_lph, 2),
                "berthed_aux_fuel_litres": aux_fuel_avoided_litres,
                "berthed_co2_kg": round(co2_avoided_kg, 1),
                "berthed_cost_usd": round(fuel_cost_saved_usd, 2)
            },
            "shore_power_on": {
                "sea_lph": round(on_lph, 2),
                "berthed_aux_fuel_litres": 0.0,
                "berthed_co2_kg": round(co2_avoided_kg * 0.15, 1),  # Clean grid residual
                "berthed_cost_usd": round(grid_electricity_cost_usd, 2)
            },
            "net_benefits": {
                "co2_saved_kg": round(co2_avoided_kg * 0.85, 1),
                "cost_saved_usd": round(fuel_cost_saved_usd - grid_electricity_cost_usd, 2),
                "noise_reduction_pct": 90.0
            }
        }



    def query_scenarios(
        self,
        vessel_type: Optional[str] = None,
        weather: Optional[str] = None,
        fuel: Optional[str] = None,
        speed: Optional[float] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Query stored CSV scenario rows with optional filters.

        vessel_type is ignored (the CSV is hull-agnostic) but accepted for API consistency.
        """
        df = self.df.copy()

        if weather:
            w_norm = self.normalize_weather(weather)
            df = df[df["weather_scenario"] == w_norm]

        if fuel:
            f_norm = self.normalize_fuel(fuel).lower()
            df = df[df["fuel_type"].str.lower() == f_norm]

        if speed is not None:
            s_clamp = self.clamp_speed(float(speed))
            df = df[df["speed_knots"] == s_clamp]

        records = []
        for _, row in df.head(limit).iterrows():
            records.append({
                "weather_scenario": row.get("weather_scenario"),
                "speed_knots": float(row.get("speed_knots", 12.0)),
                "fuel_type": row.get("fuel_type"),
                "shore_power_decision": int(row.get("shore_power_decision", 0)),
                "distance_nm": float(row.get("distance_nm", 1000.0)),
                "cargo_demand_tonnes": float(row.get("cargo_demand_tonnes", 70000.0)),
                "deadline_hours": float(row.get("deadline_hours", 100.0)),
                "predicted_fuel_lph_avg": round(float(row.get("predicted_fuel_lph_avg", 0.0)), 2),
                "catboost_lph": round(float(row.get("pred_catboost_lph", 0.0)), 2),
                "xgboost_lph": round(float(row.get("pred_xgboost_lph", 0.0)), 2),
                "lightgbm_lph": round(float(row.get("pred_lightgbm_lph", 0.0)), 2),
                "extra_trees_lph": round(float(row.get("pred_extra_trees_lph", 0.0)), 2),
                "random_forest_lph": round(float(row.get("pred_random_forest_lph", 0.0)), 2),
                "histgradientboosting_lph": round(float(row.get("pred_histgradientboosting_lph", 0.0)), 2),
                "mlp_lph": round(float(row.get("pred_neural_network_mlp_lph", 0.0)), 2),
                "svr_lph": round(float(row.get("pred_svm_svr_lph", 0.0)), 2),
                "linear_lph": round(float(row.get("pred_linear_regression_lph", 0.0)), 2),
                "fuel_price_per_litre": float(row.get("fuel_price_per_litre_placeholder", 0.8)),
                "wtw_kgco2e_per_litre": float(row.get("wtw_kgco2e_per_litre_placeholder", 3.2)),
            })
        return records

    def get_fuel_matrix(self) -> Dict[str, Any]:
        """Compute aggregate fuel consumption statistics from the full 270-scenario dataset."""
        if self.df.empty:
            return {}

        avg_lph = float(self.df["predicted_fuel_lph_avg"].mean())
        # WTW GHG: use Conventional factor (3.20 kg CO2e/L) as baseline
        # Fuel consumption at 12 kn, 1 nm = 12 kn × 1 h → avg_lph / 12 kn ≈ kg/nm
        avg_wtw_ghg = round(avg_lph * 3.20 / 12.0, 2)

        return {
            "total_scenarios": len(self.df),
            "avg_fuel_lph": round(avg_lph, 2),
            "min_fuel_lph": round(float(self.df["predicted_fuel_lph_avg"].min()), 2),
            "max_fuel_lph": round(float(self.df["predicted_fuel_lph_avg"].max()), 2),
            "avg_wtw_ghg_kg_per_nm": avg_wtw_ghg,
            "weather_scenarios": list(self.df["weather_scenario"].unique()),
            "fuel_types": list(self.df["fuel_type"].unique()),
            "speed_range": [float(self.df["speed_knots"].min()), float(self.df["speed_knots"].max())],
        }


# Global singleton instance
prediction_repo = PredictionRepository()

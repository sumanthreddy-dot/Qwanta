"""Hybrid Fuel Prediction Engine combining Machine Learning and Naval Architecture Physics."""
from typing import Dict, Any
import numpy as np
from backend.app.data.models import FuelPredictionInput, FuelPredictionOutput, ModelPredictionDetail, FUEL_CATALOG
from backend.app.physics.physics_model import NavalPhysicsModel
from backend.app.prediction.ml_models import ModelRegistry
from backend.app.data.preprocessor import DataPreprocessor


class HybridFuelPredictor:
    """Combines statistical data-driven ML models with physics domain modeling."""

    def __init__(
        self,
        registry: ModelRegistry,
        preprocessor: DataPreprocessor,
        physics: NavalPhysicsModel,
        w_ml: float = 0.65,
        w_physics: float = 0.35
    ):
        self.registry = registry
        self.preprocessor = preprocessor
        self.physics = physics
        self.w_ml = w_ml
        self.w_physics = w_physics

    def predict(self, inp: FuelPredictionInput, w_ml: float = None, w_physics: float = None) -> FuelPredictionOutput:
        """Compute ML, Physics, and Hybrid blended predictions."""
        weight_ml = self.w_ml if w_ml is None else w_ml
        weight_phys = self.w_physics if w_physics is None else w_physics
        # Normalize weights to sum to 1.0
        total_w = weight_ml + weight_phys
        if total_w <= 0:
            weight_ml, weight_phys = 0.5, 0.5
        else:
            weight_ml /= total_w
            weight_phys /= total_w

        # 1. Physics Prediction
        phys_res = self.physics.estimate_fuel(
            vessel_type=inp.vessel_type,
            capacity_tonnes=inp.capacity_tonnes,
            cargo_load_tonnes=inp.cargo_load_tonnes,
            engine_power_kw=inp.engine_power_kw,
            speed_knots=inp.speed_knots,
            distance_nm=inp.distance_nm,
            wind_speed_knots=inp.wind_speed_knots,
            wave_height_m=inp.wave_height_m,
            current_speed_knots=inp.current_speed_knots,
            weather_condition=inp.weather_condition,
            fuel_type=inp.fuel_type
        )
        phys_litres = phys_res["predicted_fuel_litres"]
        travel_time = phys_res["travel_time_hours"]

        # 2. ML Prediction
        # Build dictionary matching feature names
        input_dict = {
            "capacity_tonnes": inp.capacity_tonnes,
            "cargo_load_tonnes": inp.cargo_load_tonnes,
            "engine_power_kw": inp.engine_power_kw,
            "speed_knots": inp.speed_knots,
            "distance_nm": inp.distance_nm,
            "wind_speed_knots": inp.wind_speed_knots,
            "wave_height_m": inp.wave_height_m,
            "current_speed_knots": inp.current_speed_knots,
            "vessel_type": inp.vessel_type.value,
            "weather_condition": inp.weather_condition.value,
            "fuel_type": inp.fuel_type.value
        }

        X_trans = self.preprocessor.transform_single(input_dict)
        all_preds = self.registry.predict_all(X_trans)

        best_name = self.registry.best_model_name or list(all_preds.keys())[0]
        ml_best_litres = all_preds[best_name]

        # 3. Hybrid Combination
        hybrid_litres = (weight_ml * ml_best_litres) + (weight_phys * phys_litres)

        # 4. Uncertainty Estimation (Epistemic model variance + physics divergence)
        pred_values = list(all_preds.values())
        model_std = float(np.std(pred_values)) if len(pred_values) > 1 else ml_best_litres * 0.04
        discrepancy = abs(ml_best_litres - phys_litres)
        uncertainty = round(model_std * 0.6 + discrepancy * 0.2, 1)

        # Model breakdown details
        details = [
            ModelPredictionDetail(
                model_name=name,
                predicted_litres=round(val, 1),
                mae_estimate=round(abs(val - hybrid_litres) * 0.5, 1)
            )
            for name, val in all_preds.items()
        ]

        # Emissions and Fuel Cost
        fuel_spec = FUEL_CATALOG.get(inp.fuel_type, FUEL_CATALOG[inp.fuel_type])
        co2_kg = hybrid_litres * fuel_spec.co2_factor_kg_per_l
        cost_usd = hybrid_litres * fuel_spec.price_usd_per_litre

        return FuelPredictionOutput(
            ml_prediction_litres=round(ml_best_litres, 1),
            physics_prediction_litres=round(phys_litres, 1),
            hybrid_prediction_litres=round(hybrid_litres, 1),
            hybrid_weights={"ml": round(weight_ml, 2), "physics": round(weight_phys, 2)},
            predicted_co2_kg=round(co2_kg, 1),
            predicted_fuel_cost_usd=round(cost_usd, 2),
            travel_time_hours=round(travel_time, 1),
            uncertainty_litres=uncertainty,
            models_breakdown=details,
            best_ml_model_name=best_name
        )

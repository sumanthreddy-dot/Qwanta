"""Prediction Service for QWANTA Fleet Decision Engine.

Coordinates the CSV prediction repository with naval hydrodynamics physics,
calculates voyage durations, fuel consumption, costs, and Well-to-Wake (WTW) GHG.
Distinguishes between 'ML/reference prediction' and 'Physics-derived estimate'.
"""
from typing import Dict, Any, Optional, List
import uuid
import numpy as np

from backend.app.prediction.prediction_repository import (
    prediction_repo,
    DEFAULT_FUEL_PRICES_USD,
    DEFAULT_WTW_EMISSION_FACTORS,
    MODEL_MAPPING,
    MODEL_DISPLAY_NAMES
)
from backend.app.physics.physics_model import NavalPhysicsModel
from backend.app.data.models import (
    FuelPredictionInput,
    FuelPredictionOutput,
    VesselType,
    FuelType,
    WeatherCondition
)


class PredictionService:
    """Service handling fuel prediction, operational condition modeling, and voyage calculations."""

    def __init__(self):
        self.repo = prediction_repo
        self.physics = NavalPhysicsModel()

    def predict(
        self,
        vessel_id: Optional[str] = None,
        vessel_name: Optional[str] = None,
        vessel_type: str = "Container",
        capacity_tonnes: float = 85000.0,
        cargo_load_tonnes: float = 60000.0,
        engine_power_kw: float = 48000.0,
        speed_knots: float = 14.0,
        distance_nm: float = 1200.0,
        weather: str = "Normal",
        fuel_type: str = "Conventional",
        shore_power: int = 0,
        selected_model: str = "catboost",
        fuel_price_per_litre: Optional[float] = None,
        wtw_emission_factor: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Generate fuel, cost, WTW GHG and transit metrics for an operational scenario."""
        speed = float(speed_knots)
        dist = max(1.0, float(distance_nm))
        hours = dist / max(1.0, speed)

        f_norm = self.repo.normalize_fuel(fuel_type)
        w_norm = self.repo.normalize_weather(weather)
        p_norm = 1 if shore_power else 0

        # Check if condition is directly represented in the CSV (speeds 8.0 - 16.0 kn)
        is_exact_csv_speed = 8.0 <= speed <= 16.0
        scenario_row = self.repo.get_exact_scenario(w_norm, speed, f_norm, p_norm)

        model_col = MODEL_MAPPING.get(selected_model.lower(), "pred_catboost_lph")
        model_display = MODEL_DISPLAY_NAMES.get(selected_model.lower(), "CatBoost")

        data_source = "ML/reference prediction"
        
        if scenario_row and is_exact_csv_speed:
            base_lph = float(scenario_row.get(model_col, 0.0))
            # Scale if vessel capacity significantly deviates from 70,000t reference
            # Capacity scaling exponent is ~0.67 (Admiralty coefficient law)
            ref_capacity = 70000.0
            if capacity_tonnes and capacity_tonnes > 0 and abs(capacity_tonnes - ref_capacity) > 10000.0:
                scale_factor = (capacity_tonnes / ref_capacity) ** 0.55
                predicted_lph = base_lph * scale_factor
                data_source = "ML/reference prediction (scaled by vessel capacity)"
            else:
                predicted_lph = base_lph
        else:
            # Physics-derived estimation when outside 8-16 kn or reference scenario unavailable
            data_source = "Physics-derived estimate"
            # Map vessel type
            try:
                v_type = VesselType(vessel_type)
            except Exception:
                v_type = VesselType.CONTAINER

            try:
                f_type = FuelType(fuel_type)
            except Exception:
                f_type = FuelType.VLSFO

            w_cond = WeatherCondition.CALM if w_norm == "Normal" else (
                WeatherCondition.ROUGH if w_norm == "Severe Weather" else WeatherCondition.MODERATE
            )

            physics_res = self.physics.estimate_fuel(
                vessel_type=v_type,
                capacity_tonnes=capacity_tonnes,
                cargo_load_tonnes=cargo_load_tonnes,
                engine_power_kw=engine_power_kw,
                speed_knots=speed,
                distance_nm=dist,
                weather_condition=w_cond,
                fuel_type=f_type
            )
            predicted_lph = physics_res["predicted_fuel_litres"] / max(1.0, hours)

        # Apply Shore Power reduction if vessel is equipped and in berth
        # (At sea, main engine drives propulsion; in port, auxiliary gensets are relieved)
        berthed_energy_saved_kwh = 0.0
        if p_norm == 1:
            berthed_energy_saved_kwh = 1800.0  # Equivalent energy supplied by clean shore power

        total_litres = predicted_lph * hours
        fuel_price = fuel_price_per_litre if fuel_price_per_litre is not None else DEFAULT_FUEL_PRICES_USD.get(f_norm, 0.82)
        emission_factor = wtw_emission_factor if wtw_emission_factor is not None else DEFAULT_WTW_EMISSION_FACTORS.get(f_norm, 3.20)

        fuel_cost_usd = total_litres * fuel_price
        wtw_co2_kg = total_litres * emission_factor
        wtw_co2_tonnes = wtw_co2_kg / 1000.0
        fuel_mt = total_litres * 0.00085

        # IMO CII calculation: gCO2 / (capacity_tonnes * distance_nm)
        cii_score = round((wtw_co2_kg * 1000.0) / (max(1000.0, capacity_tonnes) * max(1.0, dist)), 2)
        if cii_score < 4.0:
            cii_rating = "A"
        elif cii_score < 6.0:
            cii_rating = "B"
        elif cii_score < 8.5:
            cii_rating = "C"
        elif cii_score < 11.5:
            cii_rating = "D"
        else:
            cii_rating = "E"

        # Model comparison at this condition
        multi_model_comp = self.repo.get_model_comparison_at_condition(
            weather=w_norm,
            speed_knots=speed,
            fuel_type=f_norm,
            distance_nm=dist,
            shore_power=p_norm
        )

        return {
            "prediction_id": f"QW-PRED-{uuid.uuid4().hex[:8].upper()}",
            "vessel_id": vessel_id,
            "vessel_name": vessel_name or f"{vessel_type} Asset",
            "vessel_type": vessel_type,
            "weather_scenario": w_norm,
            "cruising_speed_knots": round(speed, 1),
            "distance_nm": round(dist, 1),
            "voyage_duration_hours": round(hours, 1),
            "voyage_duration_days": round(hours / 24.0, 2),
            "fuel_type": f_norm,
            "shore_power": bool(p_norm),
            "model_used": model_display,
            "model_key": selected_model,
            "data_source": data_source,
            "predicted_fuel_lph": round(predicted_lph, 2),
            "total_fuel_litres": round(total_litres, 1),
            "total_fuel_mt": round(fuel_mt, 2),
            "fuel_price_per_litre_usd": fuel_price,
            "total_fuel_cost_usd": round(fuel_cost_usd, 2),
            "wtw_emission_factor": emission_factor,
            "total_wtw_co2_kg": round(wtw_co2_kg, 1),
            "total_wtw_co2_tonnes": round(wtw_co2_tonnes, 2),
            "imo_cii_score": cii_score,
            "imo_cii_rating": cii_rating,
            "berthed_energy_saved_kwh": berthed_energy_saved_kwh,
            "all_models_comparison": multi_model_comp
        }


prediction_service = PredictionService()

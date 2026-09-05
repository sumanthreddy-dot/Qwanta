"""Realistic Maritime Fleet Dataset Generator.

Generates 10,000+ operational records with non-linear physics correlations,
weather conditions, multi-fuel properties, and operational parameters.
"""
import random
import numpy as np
import pandas as pd
from typing import Optional, List, Dict
from pathlib import Path
from backend.app.data.models import VesselType, FuelType, WeatherCondition
from backend.app.physics.physics_model import NavalPhysicsModel


# Predefined global strategic maritime ports and typical route legs
PORT_NODES = [
    {"code": "SGP", "name": "Singapore"},
    {"code": "SHA", "name": "Shanghai"},
    {"code": "RTM", "name": "Rotterdam"},
    {"code": "SUZ", "name": "Suez Canal"},
    {"code": "BOM", "name": "Mumbai"},
    {"code": "DXB", "name": "Dubai"},
    {"code": "PUS", "name": "Busan"},
    {"code": "CMB", "name": "Colombo"},
    {"code": "SSZ", "name": "Santos"},
    {"code": "LAX", "name": "Los Angeles"},
    {"code": "PAN", "name": "Panama Canal"},
    {"code": "ANR", "name": "Antwerp"}
]

VESSEL_CATALOG = [
    {"vessel_id": "V-01", "name": "Ocean Titan", "type": VesselType.CONTAINER, "capacity": 120000.0, "power": 65000.0, "fuels": [FuelType.HFO, FuelType.LNG]},
    {"vessel_id": "V-02", "name": "Pacific Voyager", "type": VesselType.CONTAINER, "capacity": 85000.0, "power": 48000.0, "fuels": [FuelType.HFO, FuelType.MGO, FuelType.LNG]},
    {"vessel_id": "V-03", "name": "Baltic Carrier", "type": VesselType.BULK_CARRIER, "capacity": 75000.0, "power": 12000.0, "fuels": [FuelType.HFO, FuelType.MGO]},
    {"vessel_id": "V-04", "name": "Atlantic Pioneer", "type": VesselType.BULK_CARRIER, "capacity": 60000.0, "power": 9800.0, "fuels": [FuelType.MGO, FuelType.BIOFUEL]},
    {"vessel_id": "V-05", "name": "Nordic Star", "type": VesselType.OIL_TANKER, "capacity": 110000.0, "power": 16000.0, "fuels": [FuelType.HFO, FuelType.LNG]},
    {"vessel_id": "V-06", "name": "Suez Sovereign", "type": VesselType.OIL_TANKER, "capacity": 150000.0, "power": 22000.0, "fuels": [FuelType.HFO, FuelType.MGO]},
    {"vessel_id": "V-07", "name": "Eco Q-Flex", "type": VesselType.LNG_CARRIER, "capacity": 95000.0, "power": 28000.0, "fuels": [FuelType.LNG, FuelType.MGO, FuelType.BIOFUEL]},
    {"vessel_id": "V-08", "name": "Polar Breeze", "type": VesselType.LNG_CARRIER, "capacity": 80000.0, "power": 24000.0, "fuels": [FuelType.LNG, FuelType.BIOFUEL]},
    {"vessel_id": "V-09", "name": "Channel Express", "type": VesselType.RORO_FERRY, "capacity": 18000.0, "power": 19000.0, "fuels": [FuelType.MGO, FuelType.ELECTRIC]},
    {"vessel_id": "V-10", "name": "Strait Horizon", "type": VesselType.RORO_FERRY, "capacity": 22000.0, "power": 21000.0, "fuels": [FuelType.MGO, FuelType.LNG, FuelType.BIOFUEL]},
]


class MaritimeDatasetGenerator:
    """Generates synthetic maritime operational datasets calibrated with naval physics."""

    def __init__(self, seed: int = 42):
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)
        self.physics = NavalPhysicsModel()

    def generate(self, n_samples: int = 15000, output_csv: Optional[str] = None) -> pd.DataFrame:
        """Generate n_samples operational voyage records with realistic correlations."""
        records: List[Dict] = []

        weather_dist = [
            (WeatherCondition.CALM, 0.35, (5.0, 10.0), (0.5, 1.2)),
            (WeatherCondition.MODERATE, 0.45, (10.0, 18.0), (1.2, 2.5)),
            (WeatherCondition.ROUGH, 0.15, (18.0, 28.0), (2.5, 4.5)),
            (WeatherCondition.STORMY, 0.05, (28.0, 45.0), (4.5, 7.5))
        ]
        weather_choices = [w[0] for w in weather_dist]
        weather_probs = [w[1] for w in weather_dist]

        for i in range(n_samples):
            # Select vessel configuration
            vessel = random.choice(VESSEL_CATALOG)
            vessel_type = vessel["type"]
            vessel_id = vessel["vessel_id"]
            capacity = vessel["capacity"]
            engine_power = vessel["power"]

            # Realistic cargo load (40% to 98% of capacity)
            load_factor = np.random.beta(5.0, 2.0)  # skewed towards higher capacity utilization
            cargo_load = round(capacity * (0.35 + 0.63 * load_factor), 1)

            # Operating speed (knots)
            # Typically 12 to 22 knots depending on vessel type
            if vessel_type == VesselType.CONTAINER:
                speed_knots = round(np.random.normal(18.0, 2.0), 1)
            elif vessel_type in [VesselType.BULK_CARRIER, VesselType.OIL_TANKER]:
                speed_knots = round(np.random.normal(13.5, 1.5), 1)
            elif vessel_type == VesselType.LNG_CARRIER:
                speed_knots = round(np.random.normal(16.5, 1.8), 1)
            else:
                speed_knots = round(np.random.normal(19.0, 2.2), 1)
            speed_knots = max(10.0, min(24.0, speed_knots))

            # Voyage distance (nautical miles)
            # Short sea (300 - 1,200 nm), Medium (1,200 - 3,500 nm), Deep sea (3,500 - 11,000 nm)
            dist_category = np.random.choice(["short", "medium", "deep"], p=[0.25, 0.45, 0.30])
            if dist_category == "short":
                distance_nm = round(np.random.uniform(300.0, 1200.0), 1)
            elif dist_category == "medium":
                distance_nm = round(np.random.uniform(1200.0, 3800.0), 1)
            else:
                distance_nm = round(np.random.uniform(3800.0, 10500.0), 1)

            # Weather and sea conditions
            w_idx = np.random.choice(len(weather_choices), p=weather_probs)
            w_cond = weather_choices[w_idx]
            wind_range = weather_dist[w_idx][2]
            wave_range = weather_dist[w_idx][3]

            wind_speed = round(np.random.uniform(wind_range[0], wind_range[1]), 1)
            wave_height = round(np.random.uniform(wave_range[0], wave_range[1]), 2)
            current_speed = round(np.random.exponential(0.6), 2)  # knots
            current_speed = min(3.0, current_speed)
            current_angle = round(np.random.uniform(0.0, 360.0), 1)
            relative_wind_angle = round(np.random.uniform(0.0, 180.0), 1)

            # Fuel selection compatible with vessel
            fuel_type = random.choice(vessel["fuels"])

            # Ports
            orig_port, dest_port = random.sample([p["code"] for p in PORT_NODES], 2)
            route_id = f"R-{orig_port}-{dest_port}"

            # Compute physics ground-truth baseline
            physics_res = self.physics.estimate_fuel(
                vessel_type=vessel_type,
                capacity_tonnes=capacity,
                cargo_load_tonnes=cargo_load,
                engine_power_kw=engine_power,
                speed_knots=speed_knots,
                distance_nm=distance_nm,
                wind_speed_knots=wind_speed,
                wave_height_m=wave_height,
                current_speed_knots=current_speed,
                weather_condition=w_cond,
                fuel_type=fuel_type,
                relative_wind_angle_deg=relative_wind_angle,
                current_angle_deg=current_angle
            )

            # Add calibrated realistic operational stochasticity:
            # - Hull fouling factor (+0% to +8%)
            # - Sensor uncertainty & trim variation (+- 3.5%)
            fouling_factor = 1.0 + np.random.uniform(0.0, 0.08)
            sensor_noise = np.random.normal(1.0, 0.035)
            actual_fuel_litres = round(physics_res["predicted_fuel_litres"] * fouling_factor * sensor_noise, 1)

            # Derived CO2 and travel time
            from backend.app.data.models import FUEL_CATALOG
            fuel_spec = FUEL_CATALOG[fuel_type]
            co2_emission_kg = round(actual_fuel_litres * fuel_spec.co2_factor_kg_per_l, 1)
            fuel_cost_usd = round(actual_fuel_litres * fuel_spec.price_usd_per_litre, 2)
            travel_time_hours = physics_res["travel_time_hours"]

            # Deadline with feasible margin
            deadline_margin = np.random.uniform(1.08, 1.45)
            deadline_hours = round(travel_time_hours * deadline_margin, 1)

            records.append({
                "vessel_id": vessel_id,
                "vessel_type": vessel_type.value,
                "capacity_tonnes": capacity,
                "cargo_load_tonnes": cargo_load,
                "engine_power_kw": engine_power,
                "speed_knots": speed_knots,
                "distance_nm": distance_nm,
                "wind_speed_knots": wind_speed,
                "wave_height_m": wave_height,
                "current_speed_knots": current_speed,
                "weather_condition": w_cond.value,
                "fuel_type": fuel_type.value,
                "fuel_price": fuel_spec.price_usd_per_litre,
                "fuel_consumed_litres": actual_fuel_litres,
                "co2_emission_kg": co2_emission_kg,
                "travel_time_hours": travel_time_hours,
                "route_id": route_id,
                "origin_port": orig_port,
                "destination_port": dest_port,
                "deadline_hours": deadline_hours
            })

        df = pd.DataFrame(records)

        if output_csv:
            path = Path(output_csv)
            path.parent.mkdir(parents=True, exist_ok=True)
            df.to_csv(path, index=False)

        return df


if __name__ == "__main__":
    generator = MaritimeDatasetGenerator(seed=2026)
    df = generator.generate(15000, "data/synthetic/maritime_operations_15k.csv")
    print(f"Generated {len(df)} records. Sample head:")
    print(df.head(3))

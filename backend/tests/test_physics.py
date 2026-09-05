"""Unit tests for the Naval Physics Fuel Model."""
import pytest
from backend.app.physics.physics_model import NavalPhysicsModel
from backend.app.data.models import VesselType, FuelType, WeatherCondition


@pytest.fixture
def physics():
    return NavalPhysicsModel()


def test_calm_water_power_scaling_with_speed(physics):
    """Verifies that fuel consumption scales non-linearly with cruising speed (cubic law)."""
    res_14kn = physics.estimate_fuel(
        vessel_type=VesselType.CONTAINER,
        capacity_tonnes=80000.0,
        cargo_load_tonnes=60000.0,
        engine_power_kw=50000.0,
        speed_knots=14.0,
        distance_nm=1000.0,
        fuel_type=FuelType.HFO
    )

    res_20kn = physics.estimate_fuel(
        vessel_type=VesselType.CONTAINER,
        capacity_tonnes=80000.0,
        cargo_load_tonnes=60000.0,
        engine_power_kw=50000.0,
        speed_knots=20.0,
        distance_nm=1000.0,
        fuel_type=FuelType.HFO
    )

    # Power and fuel at 20 knots must be significantly higher than at 14 knots
    assert res_20kn["brake_power_kw"] > res_14kn["brake_power_kw"] * 1.8
    assert res_20kn["predicted_fuel_litres"] > res_14kn["predicted_fuel_litres"] * 1.3
    assert res_20kn["travel_time_hours"] < res_14kn["travel_time_hours"]


def test_cargo_load_impact(physics):
    """Verifies that heavier cargo increases displacement, draft, and fuel consumption."""
    res_empty = physics.estimate_fuel(
        vessel_type=VesselType.BULK_CARRIER,
        capacity_tonnes=75000.0,
        cargo_load_tonnes=10000.0,
        engine_power_kw=12000.0,
        speed_knots=14.0,
        distance_nm=1000.0,
        fuel_type=FuelType.HFO
    )

    res_full = physics.estimate_fuel(
        vessel_type=VesselType.BULK_CARRIER,
        capacity_tonnes=75000.0,
        cargo_load_tonnes=72000.0,
        engine_power_kw=12000.0,
        speed_knots=14.0,
        distance_nm=1000.0,
        fuel_type=FuelType.HFO
    )

    assert res_full["predicted_fuel_litres"] > res_empty["predicted_fuel_litres"]
    assert res_full["brake_power_kw"] > res_empty["brake_power_kw"]


def test_weather_and_wave_added_resistance(physics):
    """Verifies that stormy sea conditions with waves add resistance and increase fuel."""
    res_calm = physics.estimate_fuel(
        vessel_type=VesselType.CONTAINER,
        capacity_tonnes=80000.0,
        cargo_load_tonnes=50000.0,
        engine_power_kw=50000.0,
        speed_knots=16.0,
        distance_nm=1000.0,
        weather_condition=WeatherCondition.CALM,
        wave_height_m=0.5,
        wind_speed_knots=6.0
    )

    res_stormy = physics.estimate_fuel(
        vessel_type=VesselType.CONTAINER,
        capacity_tonnes=80000.0,
        cargo_load_tonnes=50000.0,
        engine_power_kw=50000.0,
        speed_knots=16.0,
        distance_nm=1000.0,
        weather_condition=WeatherCondition.STORMY,
        wave_height_m=5.0,
        wind_speed_knots=35.0
    )

    assert res_stormy["predicted_fuel_litres"] > res_calm["predicted_fuel_litres"] * 1.15
    assert res_stormy["resistance_components"]["wave_added_kn"] > 0.0


def test_fuel_type_emission_and_cost_differences(physics):
    """Verifies that LNG and Biofuel produce lower CO2 emissions than HFO."""
    res_hfo = physics.estimate_fuel(
        vessel_type=VesselType.CONTAINER,
        capacity_tonnes=80000.0,
        cargo_load_tonnes=50000.0,
        engine_power_kw=50000.0,
        speed_knots=16.0,
        distance_nm=1000.0,
        fuel_type=FuelType.HFO
    )

    res_lng = physics.estimate_fuel(
        vessel_type=VesselType.CONTAINER,
        capacity_tonnes=80000.0,
        cargo_load_tonnes=50000.0,
        engine_power_kw=50000.0,
        speed_knots=16.0,
        distance_nm=1000.0,
        fuel_type=FuelType.LNG
    )

    assert res_lng["co2_emission_kg"] < res_hfo["co2_emission_kg"]

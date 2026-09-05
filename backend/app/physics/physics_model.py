"""Naval Architecture and Physics-based Maritime Fuel Consumption Model.

Implements hydrodynamic drag resistance, Kwon wave added resistance,
wind drag, current vector adjustments, and SFOC engine load curves.
"""
import math
from typing import Dict, Any, Tuple
from backend.app.data.models import VesselType, FuelType, FUEL_CATALOG, WeatherCondition


class NavalPhysicsModel:
    """Physics-inspired fuel consumption estimation engine for maritime vessels and transport assets."""

    # Seawater and air physical constants
    RHO_SEAWATER = 1025.0       # kg/m^3
    KINEMATIC_VISCOSITY = 1.19e-6  # m^2/s at 15 deg C
    RHO_AIR = 1.225             # kg/m^3
    GRAVITY = 9.80665           # m/s^2

    # Baseline vessel dimensions lookup by type (Length pp, Beam, Design Draft, Block Coeff Cb)
    VESSEL_SPECS: Dict[VesselType, Dict[str, float]] = {
        VesselType.CONTAINER: {
            "length_m": 294.0,
            "beam_m": 32.2,
            "draft_m": 13.5,
            "block_coefficient": 0.65,
            "frontal_area_m2": 850.0,
            "propulsive_efficiency": 0.70,
            "lightship_ratio": 0.35,  # lightship weight as fraction of DWT
            "base_sfoc_g_kwh": 172.0  # standard HFO reference SFOC at optimum
        },
        VesselType.BULK_CARRIER: {
            "length_m": 225.0,
            "beam_m": 32.2,
            "draft_m": 14.2,
            "block_coefficient": 0.82,
            "frontal_area_m2": 520.0,
            "propulsive_efficiency": 0.68,
            "lightship_ratio": 0.22,
            "base_sfoc_g_kwh": 175.0
        },
        VesselType.OIL_TANKER: {
            "length_m": 250.0,
            "beam_m": 44.0,
            "draft_m": 15.0,
            "block_coefficient": 0.80,
            "frontal_area_m2": 580.0,
            "propulsive_efficiency": 0.67,
            "lightship_ratio": 0.20,
            "base_sfoc_g_kwh": 174.0
        },
        VesselType.LNG_CARRIER: {
            "length_m": 288.0,
            "beam_m": 45.0,
            "draft_m": 12.0,
            "block_coefficient": 0.72,
            "frontal_area_m2": 950.0,
            "propulsive_efficiency": 0.72,
            "lightship_ratio": 0.40,
            "base_sfoc_g_kwh": 165.0
        },
        VesselType.RORO_FERRY: {
            "length_m": 180.0,
            "beam_m": 28.0,
            "draft_m": 6.8,
            "block_coefficient": 0.58,
            "frontal_area_m2": 720.0,
            "propulsive_efficiency": 0.71,
            "lightship_ratio": 0.50,
            "base_sfoc_g_kwh": 180.0
        },
        VesselType.HEAVY_TRUCK: {
            "length_m": 16.5,
            "beam_m": 2.5,
            "draft_m": 0.0,
            "block_coefficient": 0.85,
            "frontal_area_m2": 10.5,
            "propulsive_efficiency": 0.85,
            "lightship_ratio": 0.35,
            "base_sfoc_g_kwh": 210.0
        }
    }

    def __init__(self):
        pass

    def estimate_fuel(
        self,
        vessel_type: VesselType,
        capacity_tonnes: float,
        cargo_load_tonnes: float,
        engine_power_kw: float,
        speed_knots: float,
        distance_nm: float,
        wind_speed_knots: float = 12.0,
        wave_height_m: float = 1.8,
        current_speed_knots: float = 0.5,
        weather_condition: WeatherCondition = WeatherCondition.MODERATE,
        fuel_type: FuelType = FuelType.HFO,
        relative_wind_angle_deg: float = 30.0,
        current_angle_deg: float = 45.0
    ) -> Dict[str, Any]:
        """Calculates physically grounded fuel consumption, transit time, power, and emissions."""
        # Sanitize inputs
        cargo_load_tonnes = max(0.0, min(cargo_load_tonnes, capacity_tonnes * 1.05))
        speed_knots = max(6.0, min(speed_knots, 35.0))
        distance_nm = max(1.0, distance_nm)
        wind_speed_knots = max(0.0, wind_speed_knots)
        wave_height_m = max(0.0, wave_height_m)

        # 1. Weather multiplier adjustments based on classification
        weather_factor = {
            WeatherCondition.CALM: 0.96,
            WeatherCondition.MODERATE: 1.00,
            WeatherCondition.ROUGH: 1.15,
            WeatherCondition.STORMY: 1.35
        }.get(weather_condition, 1.0)

        # 2. Spec lookup
        specs = self.VESSEL_SPECS.get(vessel_type, self.VESSEL_SPECS[VesselType.CONTAINER])
        l_pp = specs["length_m"]
        beam = specs["beam_m"]
        t_design = specs["draft_m"]
        cb = specs["block_coefficient"]
        a_transverse = specs["frontal_area_m2"]
        eta_prop = specs["propulsive_efficiency"]
        lightship_dwt = capacity_tonnes * specs["lightship_ratio"]

        # Current vector effect on speed over ground (SOG)
        current_rad = math.radians(current_angle_deg)
        effective_current_knots = current_speed_knots * math.cos(current_rad)
        # Vessel speed through water (STW) needed to maintain planned SOG
        # Or if speed_knots is STW: SOG = speed_knots + effective_current_knots
        sog_knots = max(4.0, speed_knots + effective_current_knots)
        stw_ms = speed_knots * 0.514444  # knots to m/s
        sog_ms = sog_knots * 0.514444

        # Total displacement in tonnes (lightship + actual cargo)
        total_displacement_tonnes = lightship_dwt + cargo_load_tonnes
        displacement_m3 = (total_displacement_tonnes * 1000.0) / self.RHO_SEAWATER

        # Wetted surface area approximation (Denny-Mumford formula)
        # S = L * (Cb * B + 1.7 * T) or 2.58 * sqrt(displacement * L)
        actual_draft_m = max(1.0, t_design * math.pow(total_displacement_tonnes / (lightship_dwt + capacity_tonnes), 0.55))
        wetted_surface_m2 = l_pp * (cb * beam + 1.7 * actual_draft_m)

        # 3. Calm Water Resistance (ITTC 1957 Skin Friction + Residual Drag)
        reynolds = (stw_ms * l_pp) / self.KINEMATIC_VISCOSITY
        reynolds = max(1e6, reynolds)
        cf = 0.075 / math.pow(math.log10(reynolds) - 2.0, 2)

        # Form factor (1 + k) via Prohaska
        form_factor = 1.0 + 0.6 * math.sqrt(cb * (beam / l_pp))
        # Residuary wave-making coefficient Cr (function of Froude number)
        froude = stw_ms / math.sqrt(self.GRAVITY * l_pp)
        cr = 0.0012 + 0.006 * math.pow(froude, 2.5) * cb

        ct = form_factor * cf + cr
        r_calm_n = 0.5 * self.RHO_SEAWATER * ct * wetted_surface_m2 * math.pow(stw_ms, 2)

        # 4. Wind Added Drag Resistance
        wind_rel_ms = (wind_speed_knots + speed_knots * math.cos(math.radians(relative_wind_angle_deg))) * 0.514444
        c_wind = 0.80  # aerodynamic drag coefficient
        r_wind_n = 0.5 * self.RHO_AIR * c_wind * a_transverse * math.pow(max(0.0, wind_rel_ms), 2)

        # 5. Kwon Wave Added Resistance (Empirical formulation for merchant ships)
        # Kwon: delta_R / R_calm or direct wave force
        h_s = wave_height_m
        if h_s > 0.3:
            # Empirical added resistance based on wave height squared and vessel beam
            r_wave_n = 0.065 * self.RHO_SEAWATER * self.GRAVITY * math.pow(h_s, 2) * math.pow(beam, 1.2) / math.sqrt(l_pp) * (stw_ms / 8.0)
        else:
            r_wave_n = 0.0

        # Total Resistance
        total_resistance_n = (r_calm_n + r_wind_n + r_wave_n) * weather_factor

        # 6. Effective Towing Power and Required Brake Power (BWP)
        pe_kw = (total_resistance_n * stw_ms) / 1000.0
        # Mechanical transmission efficiency ~0.98
        pb_required_kw = pe_kw / (eta_prop * 0.98)

        # Engine load ratio (capped at 100% MCR with a minimum auxiliary baseline of 8%)
        engine_load_ratio = max(0.08, min(1.05, pb_required_kw / max(1000.0, engine_power_kw)))

        # 7. Specific Fuel Oil Consumption (SFOC) Load Profile
        # Engine SFOC is parabolic with optimum around 75-80% load
        base_sfoc = specs["base_sfoc_g_kwh"]
        sfoc_load_penalty = 1.0 + 0.22 * math.pow((engine_load_ratio - 0.80) / 0.80, 2)
        sfoc_actual_hfo_ref = base_sfoc * sfoc_load_penalty

        # Fuel specification adjustment (LHV and density)
        fuel_spec = FUEL_CATALOG.get(fuel_type, FUEL_CATALOG[FuelType.HFO])
        hfo_ref_lhv = FUEL_CATALOG[FuelType.HFO].lhv_mj_per_kg
        fuel_sfoc_g_kwh = sfoc_actual_hfo_ref * (hfo_ref_lhv / fuel_spec.lhv_mj_per_kg)

        # Fuel consumption rate
        fuel_rate_kg_per_hour = (pb_required_kw * fuel_sfoc_g_kwh) / 1000.0
        fuel_rate_litres_per_hour = fuel_rate_kg_per_hour / fuel_spec.density_kg_per_l

        # Travel time calculation based on Speed Over Ground (SOG)
        travel_time_hours = distance_nm / sog_knots

        # Total Fuel & Emission Metrics
        total_fuel_litres = fuel_rate_litres_per_hour * travel_time_hours
        total_fuel_tonnes = (total_fuel_litres * fuel_spec.density_kg_per_l) / 1000.0
        co2_emission_kg = total_fuel_litres * fuel_spec.co2_factor_kg_per_l
        fuel_cost_usd = total_fuel_litres * fuel_spec.price_usd_per_litre

        return {
            "predicted_fuel_litres": round(total_fuel_litres, 2),
            "predicted_fuel_tonnes": round(total_fuel_tonnes, 4),
            "travel_time_hours": round(travel_time_hours, 2),
            "brake_power_kw": round(pb_required_kw, 1),
            "engine_load_percent": round(engine_load_ratio * 100.0, 1),
            "sfoc_g_kwh": round(fuel_sfoc_g_kwh, 1),
            "co2_emission_kg": round(co2_emission_kg, 2),
            "fuel_cost_usd": round(fuel_cost_usd, 2),
            "resistance_components": {
                "calm_water_kn": round(r_calm_n / 1000.0, 2),
                "wind_drag_kn": round(r_wind_n / 1000.0, 2),
                "wave_added_kn": round(r_wave_n / 1000.0, 2),
                "total_kn": round(total_resistance_n / 1000.0, 2)
            },
            "speed_over_ground_knots": round(sog_knots, 2)
        }

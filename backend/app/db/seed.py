"""Seed default vessels and routes into SQLite database on first run.

Vessels and routes are calibrated to match the GreenQ SIH datasets:
- GreenQ_FleetOptimization_Scenarios.csv (6 corridors, 6 vessel classes)
- GreenQ_Fleet_ALL_IN_ONE.csv (Kamsarmax telemetry reference)
- GreenQ_FuelPrediction_TimeSeries.csv (222 vessels, 504 voyages)
"""
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from .vessel_orm import VesselORM
from .route_orm import RouteORM


# ─── 6 REAL SIH CORRIDORS ──────────────────────────────────────────────────
# Distances and ports from GreenQ_FleetOptimization_Scenarios.csv

DEFAULT_ROUTES = [
    {
        "id": "R1-MOR-ROT",
        "name": "Mormugao to Rotterdam (via Suez)",
        "origin_port": "Mormugao (India)",
        "destination_port": "Rotterdam (Netherlands)",
        "distance_nm": 7800.0,
        "avg_weather_severity": 2.5,
        "seca_distance_pct": 14.0,
        "waypoints": [
            {"name": "Mormugao Port", "lat": 15.4109, "lon": 73.8005},
            {"name": "Arabian Sea", "lat": 15.0, "lon": 65.0},
            {"name": "Gulf of Aden", "lat": 12.0, "lon": 48.0},
            {"name": "Suez Canal", "lat": 29.9753, "lon": 32.5599},
            {"name": "Mediterranean", "lat": 36.0, "lon": 14.0},
            {"name": "Gibraltar", "lat": 35.98, "lon": -5.6},
            {"name": "Bay of Biscay", "lat": 45.0, "lon": -3.0},
            {"name": "Rotterdam", "lat": 51.9244, "lon": 4.4777},
        ],
    },
    {
        "id": "R2-PAR-QIN",
        "name": "Paradip to Qingdao (Bay of Bengal → South China Sea)",
        "origin_port": "Paradip (India)",
        "destination_port": "Qingdao (China)",
        "distance_nm": 4300.0,
        "avg_weather_severity": 2.8,
        "seca_distance_pct": 6.0,
        "waypoints": [
            {"name": "Paradip Port", "lat": 20.2646, "lon": 86.6862},
            {"name": "Bay of Bengal", "lat": 12.0, "lon": 88.0},
            {"name": "Malacca Strait", "lat": 2.5, "lon": 101.5},
            {"name": "South China Sea", "lat": 15.0, "lon": 114.0},
            {"name": "Taiwan Strait", "lat": 24.0, "lon": 119.0},
            {"name": "Qingdao Port", "lat": 36.0671, "lon": 120.3826},
        ],
    },
    {
        "id": "R3-VIZ-SGP",
        "name": "Visakhapatnam to Singapore (Bay of Bengal → Malacca)",
        "origin_port": "Visakhapatnam (India)",
        "destination_port": "Singapore",
        "distance_nm": 1570.0,
        "avg_weather_severity": 1.8,
        "seca_distance_pct": 4.0,
        "waypoints": [
            {"name": "Visakhapatnam Port", "lat": 17.6868, "lon": 83.2185},
            {"name": "Bay of Bengal", "lat": 10.0, "lon": 87.0},
            {"name": "Nicobar Passage", "lat": 7.0, "lon": 93.8},
            {"name": "Malacca Strait", "lat": 2.5, "lon": 101.5},
            {"name": "Singapore", "lat": 1.2903, "lon": 103.8520},
        ],
    },
    {
        "id": "R4-KAN-FUJ",
        "name": "Kandla to Fujairah (Arabian Sea → Gulf of Oman)",
        "origin_port": "Kandla (India)",
        "destination_port": "Fujairah (UAE)",
        "distance_nm": 950.0,
        "avg_weather_severity": 1.5,
        "seca_distance_pct": 0.0,
        "waypoints": [
            {"name": "Kandla Port", "lat": 23.0225, "lon": 70.2208},
            {"name": "Gulf of Kutch", "lat": 22.5, "lon": 69.5},
            {"name": "Arabian Sea (West)", "lat": 22.0, "lon": 62.0},
            {"name": "Gulf of Oman", "lat": 24.5, "lon": 57.0},
            {"name": "Fujairah Port", "lat": 25.1224, "lon": 56.3362},
        ],
    },
    {
        "id": "R5-MOR-NEW",
        "name": "Mormugao to Newcastle (Indian Ocean → Pacific)",
        "origin_port": "Mormugao (India)",
        "destination_port": "Newcastle (Australia)",
        "distance_nm": 6100.0,
        "avg_weather_severity": 3.0,
        "seca_distance_pct": 3.0,
        "waypoints": [
            {"name": "Mormugao Port", "lat": 15.4109, "lon": 73.8005},
            {"name": "Indian Ocean", "lat": 5.0, "lon": 80.0},
            {"name": "Sunda Strait", "lat": -6.0, "lon": 105.5},
            {"name": "Java Sea", "lat": -8.0, "lon": 115.0},
            {"name": "Timor Sea", "lat": -12.0, "lon": 127.0},
            {"name": "Coral Sea", "lat": -20.0, "lon": 150.0},
            {"name": "Newcastle Port", "lat": -32.9283, "lon": 151.7817},
        ],
    },
    {
        "id": "R6-CHE-COL",
        "name": "Chennai to Colombo (Short Sea Corridor)",
        "origin_port": "Chennai (India)",
        "destination_port": "Colombo (Sri Lanka)",
        "distance_nm": 600.0,
        "avg_weather_severity": 1.2,
        "seca_distance_pct": 0.0,
        "waypoints": [
            {"name": "Chennai Port", "lat": 13.0827, "lon": 80.2707},
            {"name": "Palk Strait", "lat": 10.0, "lon": 79.5},
            {"name": "Gulf of Mannar", "lat": 8.5, "lon": 79.0},
            {"name": "Colombo Port", "lat": 6.9271, "lon": 79.8612},
        ],
    },
    # ─── Retained legacy routes for backward compatibility ──────────────
    {
        "id": "R-SGP-ROT",
        "name": "Singapore to Rotterdam (via Suez)",
        "origin_port": "Singapore",
        "destination_port": "Rotterdam",
        "distance_nm": 8288.0,
        "avg_weather_severity": 2.2,
        "seca_distance_pct": 14.5,
        "waypoints": [
            {"name": "Singapore", "lat": 1.29027, "lon": 103.851959},
            {"name": "Malacca Strait", "lat": 2.5, "lon": 101.5},
            {"name": "Gulf of Aden", "lat": 12.0, "lon": 48.0},
            {"name": "Suez Canal", "lat": 29.9753, "lon": 32.5599},
            {"name": "Gibraltar", "lat": 35.98, "lon": -5.6},
            {"name": "Rotterdam", "lat": 51.9244, "lon": 4.4777},
        ],
    },
    {
        "id": "R-SHA-LAX",
        "name": "Shanghai to Los Angeles (Transpacific)",
        "origin_port": "Shanghai",
        "destination_port": "Los Angeles",
        "distance_nm": 5600.0,
        "avg_weather_severity": 3.1,
        "seca_distance_pct": 8.0,
        "waypoints": [
            {"name": "Shanghai", "lat": 31.2304, "lon": 121.4737},
            {"name": "East China Sea", "lat": 30.5, "lon": 126.0},
            {"name": "Mid Pacific", "lat": 36.0, "lon": -170.0},
            {"name": "Los Angeles", "lat": 33.7432, "lon": -118.2673},
        ],
    },
    {
        "id": "R-DXB-SIN",
        "name": "Dubai to Singapore (Indian Ocean)",
        "origin_port": "Dubai (Jebel Ali)",
        "destination_port": "Singapore",
        "distance_nm": 3650.0,
        "avg_weather_severity": 1.8,
        "seca_distance_pct": 5.0,
        "waypoints": [
            {"name": "Jebel Ali", "lat": 25.0113, "lon": 55.0612},
            {"name": "Strait of Hormuz", "lat": 26.56, "lon": 56.25},
            {"name": "Arabian Sea", "lat": 15.0, "lon": 65.0},
            {"name": "Singapore", "lat": 1.29027, "lon": 103.851959},
        ],
    },
    {
        "id": "R-BOM-MAA",
        "name": "Mumbai to Chennai (Indian Coastal Corridor)",
        "origin_port": "Mumbai",
        "destination_port": "Chennai",
        "distance_nm": 1050.0,
        "avg_weather_severity": 1.4,
        "seca_distance_pct": 0.0,
        "waypoints": [
            {"name": "Mumbai (JNPT)", "lat": 18.94, "lon": 72.83},
            {"name": "Goa Offshore", "lat": 15.4, "lon": 73.2},
            {"name": "Kochi Waypoint", "lat": 9.9, "lon": 75.8},
            {"name": "Cape Comorin", "lat": 7.9, "lon": 77.5},
            {"name": "Gulf of Mannar", "lat": 8.8, "lon": 78.8},
            {"name": "Chennai Port", "lat": 13.08, "lon": 80.27},
        ],
    },
]


# ─── 6 REAL VESSEL CLASSES FROM SIH DATASETS ───────────────────────────────
# Specs calibrated from GreenQ_FleetOptimization_Scenarios.csv vessel types
# and GreenQ_Fleet_ALL_IN_ONE.csv Kamsarmax reference telemetry.

SIH_VESSEL_CATALOG = [
    {
        "id": "V-HAN-01",
        "name": "Handysize Carrier Ganga",
        "vessel_type": "Bulk Carrier",
        "capacity_teu": 0,
        "deadweight_tonnage": 35000.0,
        "engine_rated_power_kw": 6000.0,
        "design_speed_knots": 14.5,
        "min_speed_knots": 8.0,
        "max_speed_knots": 14.5,
        "fuel_type": "Conventional",
        "supported_fuels": ["Conventional", "LNG", "Methanol", "MGO"],
        "cii_rating": "B",
        "base_consumption_rate": 12.0,  # MT/day at design speed
        "current_location": "Mormugao (India)",
        "assigned_route": "R1-MOR-ROT",
    },
    {
        "id": "V-SUP-01",
        "name": "Supramax Carrier Kaveri",
        "vessel_type": "Bulk Carrier",
        "capacity_teu": 0,
        "deadweight_tonnage": 55000.0,
        "engine_rated_power_kw": 8500.0,
        "design_speed_knots": 14.5,
        "min_speed_knots": 8.0,
        "max_speed_knots": 15.0,
        "fuel_type": "Conventional",
        "supported_fuels": ["Conventional", "LNG", "MGO"],
        "cii_rating": "B",
        "base_consumption_rate": 18.0,
        "current_location": "Paradip (India)",
        "assigned_route": "R2-PAR-QIN",
    },
    {
        "id": "V-PAN-01",
        "name": "Panamax Carrier Narmada",
        "vessel_type": "Bulk Carrier",
        "capacity_teu": 0,
        "deadweight_tonnage": 75000.0,
        "engine_rated_power_kw": 9800.0,
        "design_speed_knots": 14.5,
        "min_speed_knots": 8.0,
        "max_speed_knots": 15.5,
        "fuel_type": "Conventional",
        "supported_fuels": ["Conventional", "LNG", "Methanol", "MGO"],
        "cii_rating": "C",
        "base_consumption_rate": 25.0,
        "current_location": "Visakhapatnam (India)",
        "assigned_route": "R3-VIZ-SGP",
    },
    {
        "id": "V-KAM-01",
        "name": "Kamsarmax Carrier Godavari",
        "vessel_type": "Bulk Carrier",
        "capacity_teu": 0,
        "deadweight_tonnage": 82000.0,
        "engine_rated_power_kw": 11000.0,
        "design_speed_knots": 14.5,
        "min_speed_knots": 8.0,
        "max_speed_knots": 16.0,
        "fuel_type": "Conventional",
        "supported_fuels": ["Conventional", "LNG", "Methanol", "Ammonia", "Hydrogen"],
        "cii_rating": "B",
        "base_consumption_rate": 30.0,
        "current_location": "Kandla (India)",
        "assigned_route": "R4-KAN-FUJ",
    },
    {
        "id": "V-CAP-01",
        "name": "Capesize Carrier Brahmaputra",
        "vessel_type": "Bulk Carrier",
        "capacity_teu": 0,
        "deadweight_tonnage": 180000.0,
        "engine_rated_power_kw": 18000.0,
        "design_speed_knots": 14.5,
        "min_speed_knots": 8.5,
        "max_speed_knots": 15.5,
        "fuel_type": "Conventional",
        "supported_fuels": ["Conventional", "LNG", "MGO"],
        "cii_rating": "C",
        "base_consumption_rate": 55.0,
        "current_location": "Mormugao (India)",
        "assigned_route": "R5-MOR-NEW",
    },
    {
        "id": "V-AFR-01",
        "name": "Aframax Tanker Krishna",
        "vessel_type": "Oil Tanker",
        "capacity_teu": 0,
        "deadweight_tonnage": 115000.0,
        "engine_rated_power_kw": 15000.0,
        "design_speed_knots": 15.0,
        "min_speed_knots": 8.5,
        "max_speed_knots": 16.0,
        "fuel_type": "Conventional",
        "supported_fuels": ["Conventional", "LNG", "Methanol", "Ammonia", "MGO"],
        "cii_rating": "B",
        "base_consumption_rate": 42.0,
        "current_location": "Chennai (India)",
        "assigned_route": "R6-CHE-COL",
    },
]


# Supported fuels mapping by primary vessel fuel
FUEL_COMPATIBILITY = {
    "Conventional": ["Conventional", "MGO", "LNG"],
    "VLSFO": ["VLSFO", "Biofuel_B30", "MGO"],
    "Biofuel_B30": ["Biofuel_B30", "VLSFO", "MGO"],
    "LNG": ["LNG", "Bio-LNG", "MGO"],
    "Methanol": ["Methanol", "e-Methanol", "MGO"],
    "Ammonia": ["Ammonia", "MGO"],
    "Hydrogen": ["Hydrogen", "MGO"],
    "MGO": ["MGO", "VLSFO"],
}


def seed_default_data(db: Session):
    """Seed SIH vessel catalog and corridors if tables are empty."""
    # ── Seed vessels ─────────────────────────────────────────────────────
    vessel_count = db.query(VesselORM).count()
    if vessel_count == 0:
        for v in SIH_VESSEL_CATALOG:
            orm_vessel = VesselORM(
                id=v["id"],
                name=v["name"],
                vessel_type=v["vessel_type"],
                capacity_teu=v.get("capacity_teu", 0),
                deadweight_tonnage=v["deadweight_tonnage"],
                design_speed_knots=v["design_speed_knots"],
                min_speed_knots=v["min_speed_knots"],
                max_speed_knots=v["max_speed_knots"],
                fuel_type=v["fuel_type"],
                supported_fuels=v["supported_fuels"],
                cii_rating=v.get("cii_rating", "C"),
                base_consumption_rate=v.get("base_consumption_rate", 25.0),
                auxiliary_consumption=3.0,
                boiler_consumption=1.5,
                operational_status="Active",
                current_location=v.get("current_location", "At Sea"),
                assigned_route=v.get("assigned_route", "R1-MOR-ROT"),
            )
            db.add(orm_vessel)
        db.commit()

    # ── Seed routes ──────────────────────────────────────────────────────
    route_count = db.query(RouteORM).count()
    if route_count == 0:
        for r in DEFAULT_ROUTES:
            orm_route = RouteORM(
                id=r["id"],
                name=r["name"],
                origin_port=r["origin_port"],
                destination_port=r["destination_port"],
                distance_nm=r["distance_nm"],
                avg_weather_severity=r["avg_weather_severity"],
                seca_distance_pct=r["seca_distance_pct"],
                waypoints=r["waypoints"],
            )
            db.add(orm_route)
        db.commit()

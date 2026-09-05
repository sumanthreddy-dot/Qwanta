"""Synthetic Maritime Network Graph connecting strategic global shipping corridors."""
import networkx as nx
from typing import Dict, List, Any
from backend.app.data.models import WeatherCondition


class MaritimeNetwork:
    """Represents international sea-lanes and shipping corridors."""

    # Strategic global ports with coordinates (latitude, longitude)
    PORTS = {
        "SGP": {"name": "Singapore", "lat": 1.29, "lon": 103.85, "region": "Southeast Asia"},
        "SHA": {"name": "Shanghai", "lat": 31.23, "lon": 121.47, "region": "East Asia"},
        "RTM": {"name": "Rotterdam", "lat": 51.92, "lon": 4.47, "region": "North Europe"},
        "SUZ": {"name": "Suez Canal", "lat": 29.97, "lon": 32.55, "region": "Middle East / Choke"},
        "BOM": {"name": "Mumbai", "lat": 18.94, "lon": 72.83, "region": "South Asia"},
        "MAA": {"name": "Chennai", "lat": 13.08, "lon": 80.27, "region": "South Asia"},
        "DXB": {"name": "Dubai", "lat": 25.20, "lon": 55.27, "region": "Middle East"},
        "PUS": {"name": "Busan", "lat": 35.17, "lon": 129.07, "region": "East Asia"},
        "CMB": {"name": "Colombo", "lat": 6.92, "lon": 79.86, "region": "South Asia"},
        "SSZ": {"name": "Santos", "lat": -23.96, "lon": -46.33, "region": "South America"},
        "LAX": {"name": "Los Angeles", "lat": 33.74, "lon": -118.27, "region": "North America"},
        "PAN": {"name": "Panama Canal", "lat": 9.08, "lon": -79.68, "region": "Central America / Choke"},
        "ANR": {"name": "Antwerp", "lat": 51.22, "lon": 4.40, "region": "North Europe"}
    }

    # Shipping corridors (distance in nautical miles nm, base weather, current, congestion risk 0-1)
    CORRIDORS = [
        # East Asia - SE Asia
        ("SHA", "SGP", {"distance_nm": 2250.0, "weather": WeatherCondition.MODERATE, "current": 0.8, "risk": 0.10}),
        ("PUS", "SHA", {"distance_nm": 490.0, "weather": WeatherCondition.MODERATE, "current": 0.4, "risk": 0.05}),
        ("PUS", "SGP", {"distance_nm": 2550.0, "weather": WeatherCondition.MODERATE, "current": 0.7, "risk": 0.08}),

        # Trans-Pacific
        ("SHA", "LAX", {"distance_nm": 5800.0, "weather": WeatherCondition.ROUGH, "current": 1.1, "risk": 0.12}),
        ("PUS", "LAX", {"distance_nm": 5300.0, "weather": WeatherCondition.ROUGH, "current": 1.2, "risk": 0.10}),
        ("LAX", "PAN", {"distance_nm": 2900.0, "weather": WeatherCondition.CALM, "current": 0.5, "risk": 0.15}),

        # Indian Ocean & Coastal Corridors
        ("BOM", "MAA", {"distance_nm": 1050.0, "weather": WeatherCondition.CALM, "current": 0.5, "risk": 0.04}),
        ("MAA", "CMB", {"distance_nm": 360.0, "weather": WeatherCondition.CALM, "current": 0.4, "risk": 0.03}),
        ("MAA", "SGP", {"distance_nm": 1600.0, "weather": WeatherCondition.MODERATE, "current": 0.8, "risk": 0.07}),
        ("SGP", "CMB", {"distance_nm": 1580.0, "weather": WeatherCondition.MODERATE, "current": 0.9, "risk": 0.06}),
        ("CMB", "BOM", {"distance_nm": 890.0, "weather": WeatherCondition.CALM, "current": 0.4, "risk": 0.04}),
        ("BOM", "DXB", {"distance_nm": 1070.0, "weather": WeatherCondition.CALM, "current": 0.3, "risk": 0.08}),
        ("CMB", "SUZ", {"distance_nm": 3380.0, "weather": WeatherCondition.MODERATE, "current": 0.6, "risk": 0.22}),
        ("DXB", "SUZ", {"distance_nm": 2800.0, "weather": WeatherCondition.MODERATE, "current": 0.5, "risk": 0.25}),

        # Mediterranean & Atlantic / Europe
        ("SUZ", "RTM", {"distance_nm": 3280.0, "weather": WeatherCondition.MODERATE, "current": 0.5, "risk": 0.12}),
        ("SUZ", "ANR", {"distance_nm": 3310.0, "weather": WeatherCondition.MODERATE, "current": 0.5, "risk": 0.12}),
        ("RTM", "ANR", {"distance_nm": 95.0, "weather": WeatherCondition.CALM, "current": 0.3, "risk": 0.05}),

        # Cape Route alternative (circumventing Suez)
        ("SGP", "SSZ", {"distance_nm": 8400.0, "weather": WeatherCondition.ROUGH, "current": 1.3, "risk": 0.05}),
        ("SSZ", "RTM", {"distance_nm": 5300.0, "weather": WeatherCondition.ROUGH, "current": 0.9, "risk": 0.08}),
        ("PAN", "RTM", {"distance_nm": 4800.0, "weather": WeatherCondition.ROUGH, "current": 1.0, "risk": 0.18}),
        ("PAN", "SSZ", {"distance_nm": 4100.0, "weather": WeatherCondition.MODERATE, "current": 0.6, "risk": 0.09}),
    ]

    def __init__(self):
        self.graph = nx.Graph()
        self._build_graph()

    def _build_graph(self):
        for port_code, data in self.PORTS.items():
            self.graph.add_node(port_code, **data)

        for u, v, attrs in self.CORRIDORS:
            self.graph.add_edge(u, v, **attrs)

    def get_ports(self) -> List[Dict[str, Any]]:
        """Return list of all port nodes with metadata."""
        return [{"code": code, **data} for code, data in self.PORTS.items()]

    def get_corridors(self) -> List[Dict[str, Any]]:
        """Return list of network edges."""
        corridors = []
        for u, v, data in self.graph.edges(data=True):
            corridors.append({
                "from": u,
                "to": v,
                "from_name": self.PORTS[u]["name"],
                "to_name": self.PORTS[v]["name"],
                **data
            })
        return corridors

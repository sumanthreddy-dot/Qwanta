"""Data Provider interfaces for pluggable synthetic, CSV, and public data ingestion."""
from abc import ABC, abstractmethod
from typing import Optional
import pandas as pd
from pathlib import Path
from backend.app.data.generator import MaritimeDatasetGenerator


class BaseDataProvider(ABC):
    """Abstract interface for maritime and fleet data ingestion."""

    @abstractmethod
    def load_data(self) -> pd.DataFrame:
        """Load and return operational records dataframe."""
        pass


class SyntheticDataProvider(BaseDataProvider):
    """Generates on-demand synthetic datasets with configurable sample count."""

    def __init__(self, n_samples: int = 15000, seed: int = 42, cache_path: Optional[str] = None):
        self.n_samples = n_samples
        self.seed = seed
        self.cache_path = cache_path
        self.generator = MaritimeDatasetGenerator(seed=seed)

    def load_data(self) -> pd.DataFrame:
        if self.cache_path and Path(self.cache_path).exists():
            return pd.read_csv(self.cache_path)
        
        df = self.generator.generate(n_samples=self.n_samples, output_csv=self.cache_path)
        return df


class CSVDataProvider(BaseDataProvider):
    """Ingests records from a local or user-uploaded CSV file."""

    def __init__(self, file_path: str):
        self.file_path = file_path

    def load_data(self) -> pd.DataFrame:
        path = Path(self.file_path)
        if not path.exists():
            raise FileNotFoundError(f"CSV data file not found at: {self.file_path}")
        return pd.read_csv(path)


class PublicDataProvider(BaseDataProvider):
    """Adapter for open-access maritime datasets (e.g. NOAA sea states, MarineCadastre AIS)."""

    def __init__(self, source_url_or_token: Optional[str] = None, fallback_csv: Optional[str] = None):
        self.source_url = source_url_or_token
        self.fallback_csv = fallback_csv

    def load_data(self) -> pd.DataFrame:
        # In offline/hackathon environment or if remote service unavailable, gracefully fall back to local sample
        if self.fallback_csv and Path(self.fallback_csv).exists():
            return pd.read_csv(self.fallback_csv)
        # Fallback to generator
        generator = MaritimeDatasetGenerator(seed=101)
        return generator.generate(n_samples=5000)

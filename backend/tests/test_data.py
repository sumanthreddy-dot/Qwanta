"""Unit tests for dataset generator, preprocessor, and providers."""
import pytest
import numpy as np
from backend.app.data.generator import MaritimeDatasetGenerator
from backend.app.data.preprocessor import DataPreprocessor
from backend.app.data.providers import SyntheticDataProvider


def test_synthetic_dataset_generator():
    gen = MaritimeDatasetGenerator(seed=42)
    df = gen.generate(n_samples=50)

    assert len(df) == 50
    assert "fuel_consumed_litres" in df.columns
    assert "co2_emission_kg" in df.columns
    assert "speed_knots" in df.columns

    # Verify positive values
    assert (df["fuel_consumed_litres"] > 0).all()
    assert (df["travel_time_hours"] > 0).all()


def test_data_preprocessor_split_and_fit():
    gen = MaritimeDatasetGenerator(seed=123)
    df = gen.generate(n_samples=100)

    preprocessor = DataPreprocessor()
    X_train, y_train, X_val, y_val, X_test, y_test = preprocessor.split_and_fit(
        df, test_size=0.15, val_size=0.15
    )

    # 100 total: ~70 train, ~15 val, ~15 test
    assert len(X_train) == 70
    assert len(X_val) == 15
    assert len(X_test) == 15

    # Check feature dimension
    assert X_train.shape[1] == len(preprocessor.feature_names)
    assert not np.isnan(X_train).any()


def test_synthetic_data_provider():
    provider = SyntheticDataProvider(n_samples=30, seed=99)
    df = provider.load_data()
    assert len(df) == 30

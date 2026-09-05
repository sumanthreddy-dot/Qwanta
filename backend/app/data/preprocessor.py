"""Data Preprocessing Pipeline for Fuel Consumption Modeling.

Follows strict ML best practices: train/validation/test split BEFORE scaling
to prevent data leakage, with robust handling for missing values.
"""
from typing import Tuple, List, Optional
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
import joblib


NUMERICAL_FEATURES = [
    "capacity_tonnes",
    "cargo_load_tonnes",
    "engine_power_kw",
    "speed_knots",
    "distance_nm",
    "wind_speed_knots",
    "wave_height_m",
    "current_speed_knots"
]

CATEGORICAL_FEATURES = [
    "vessel_type",
    "weather_condition",
    "fuel_type"
]

TARGET_FEATURE = "fuel_consumed_litres"


class DataPreprocessor:
    """Preprocesses fleet operational datasets for training and inference."""

    def __init__(self):
        self.pipeline: Optional[ColumnTransformer] = None
        self.feature_names: List[str] = []

    def build_transformer(self) -> ColumnTransformer:
        """Construct scikit-learn preprocessing ColumnTransformer."""
        num_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])

        cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ])

        transformer = ColumnTransformer(
            transformers=[
                ("num", num_pipeline, NUMERICAL_FEATURES),
                ("cat", cat_pipeline, CATEGORICAL_FEATURES)
            ],
            remainder="drop"
        )
        return transformer

    def split_and_fit(
        self,
        df: pd.DataFrame,
        test_size: float = 0.15,
        val_size: float = 0.15,
        random_state: int = 42
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Split dataframe into Train, Val, Test, then fit preprocessor on Train ONLY."""
        # Sanitize and drop rows missing essential features or target
        clean_df = df.dropna(subset=[TARGET_FEATURE]).copy()

        X = clean_df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
        y = clean_df[TARGET_FEATURE].values

        # First split: Train vs Temp (Val + Test)
        temp_ratio = test_size + val_size
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=temp_ratio, random_state=random_state
        )

        # Second split: Val vs Test
        val_ratio_of_temp = val_size / temp_ratio
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=(1.0 - val_ratio_of_temp), random_state=random_state
        )

        # Build and fit pipeline strictly on training data
        self.pipeline = self.build_transformer()
        X_train_trans = self.pipeline.fit_transform(X_train)
        X_val_trans = self.pipeline.transform(X_val)
        X_test_trans = self.pipeline.transform(X_test)

        # Extract transformed feature names
        num_names = NUMERICAL_FEATURES
        cat_encoder = self.pipeline.named_transformers_["cat"].named_steps["encoder"]
        cat_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
        self.feature_names = num_names + cat_names

        return X_train_trans, y_train, X_val_trans, y_val, X_test_trans, y_test

    def transform_single(self, input_dict: dict) -> np.ndarray:
        """Transform a single input dictionary for real-time inference."""
        if self.pipeline is None:
            raise ValueError("Preprocessor pipeline is not fitted yet!")
        
        row_df = pd.DataFrame([input_dict])
        # Ensure all columns exist
        for col in NUMERICAL_FEATURES:
            if col not in row_df.columns:
                row_df[col] = np.nan
        for col in CATEGORICAL_FEATURES:
            if col not in row_df.columns:
                row_df[col] = "Unknown"

        return self.pipeline.transform(row_df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES])

    def save(self, filepath: str):
        """Persist preprocessor to disk."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({"pipeline": self.pipeline, "feature_names": self.feature_names}, path)

    def load(self, filepath: str):
        """Load preprocessor from disk."""
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Preprocessor file not found at: {filepath}")
        data = joblib.load(path)
        self.pipeline = data["pipeline"]
        self.feature_names = data["feature_names"]

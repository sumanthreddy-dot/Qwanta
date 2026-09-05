"""Standalone script to preprocess data and train all 5 regression models."""
import argparse
from pathlib import Path
import sys
import pandas as pd
import joblib

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.data.preprocessor import DataPreprocessor
from backend.app.prediction.ml_models import ModelRegistry
from backend.app.prediction.evaluator import ModelEvaluator
from backend.app.data.generator import MaritimeDatasetGenerator


def main():
    parser = argparse.ArgumentParser(description="Train and evaluate regression models for fuel prediction.")
    parser.add_argument("--data", type=str, default="data/synthetic/maritime_operations_15k.csv", help="Input CSV dataset")
    parser.add_argument("--models-dir", type=str, default="models", help="Directory to persist trained models")
    args = parser.parse_args()

    data_file = Path(args.data)
    if not data_file.exists():
        print(f"Dataset not found at {args.data}. Generating 15,000 synthetic records first...")
        gen = MaritimeDatasetGenerator(seed=2026)
        df = gen.generate(15000, output_csv=args.data)
    else:
        df = pd.read_csv(data_file)

    print(f"Loaded dataset with {len(df)} records. Fitting preprocessor...")
    preprocessor = DataPreprocessor()
    X_train, y_train, X_val, y_val, X_test, y_test = preprocessor.split_and_fit(df)
    preprocessor.save(Path(args.models_dir) / "preprocessor.joblib")
    print(f"Preprocessor saved. Features: {len(preprocessor.feature_names)}")

    registry = ModelRegistry()
    print("Training 5 ML architectures: Linear, Random Forest, SVR, Gradient Boosting, MLP...")
    registry.train_all(X_train, y_train)

    print("Evaluating models on validation split...")
    best_name, val_metrics = ModelEvaluator.compare_and_select_best(
        registry.trained_models, X_val, y_val
    )
    registry.best_model_name = best_name

    print("\n--- MODEL PERFORMANCE COMPARISON (Validation Set) ---")
    for name, m in val_metrics.items():
        ci_str = f"[{m['mae_ci_95'][0]}, {m['mae_ci_95'][1]}]"
        print(f"[{name}]")
        print(f"   MAE:  {m['mae']} L  (95% CI: {ci_str})")
        print(f"   RMSE: {m['rmse']} L")
        print(f"   R2:   {m['r2']}")
        print(f"   MAPE: {m['mape']}%\n")

    print(f"Champion Model Selected: >>> {best_name} <<<")

    # Evaluate on test set
    test_results = {}
    for name, model in registry.trained_models.items():
        test_results[name] = ModelEvaluator.evaluate_model(y_test, model.predict(X_test))

    all_metrics = {
        "validation_set": val_metrics,
        "test_set": test_results,
        "champion": best_name
    }

    registry.save_all(args.models_dir)
    joblib.dump(all_metrics, Path(args.models_dir) / "metrics.joblib")
    print(f"All models and metrics persisted to '{args.models_dir}/'")


if __name__ == "__main__":
    main()

"""Standalone script to generate synthetic maritime fleet dataset."""
import argparse
from pathlib import Path
import sys

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.data.generator import MaritimeDatasetGenerator


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic maritime operations dataset.")
    parser.add_argument("--samples", type=int, default=15000, help="Number of records to generate (default: 15000)")
    parser.add_argument("--output", type=str, default="data/synthetic/maritime_operations_15k.csv", help="Output CSV path")
    parser.add_argument("--seed", type=int, default=2026, help="Random seed for reproducibility")
    args = parser.parse_args()

    print(f"Generating {args.samples} operational voyage records with seed {args.seed}...")
    generator = MaritimeDatasetGenerator(seed=args.seed)
    df = generator.generate(n_samples=args.samples, output_csv=args.output)
    print(f"Dataset successfully created at: {args.output}")
    print(f"Shape: {df.shape}")
    print("Sample record summary:")
    print(df[["vessel_id", "vessel_type", "speed_knots", "distance_nm", "fuel_type", "fuel_consumed_litres", "co2_emission_kg"]].head(3))


if __name__ == "__main__":
    main()

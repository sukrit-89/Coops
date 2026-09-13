"""
Demand forecast training script.

Trains a LightGBM model to predict daily job count per service/zone
using synthetic + real booking history.

Usage:
    python ml/train_demand_forecast.py --data data/bookings_history.csv

Acceptance criteria (per PRD):
    - MAPE < 25%
    - R² > 0.6
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_percentage_error, r2_score
from sklearn.model_selection import train_test_split

MODEL_DIR = Path(__file__).resolve().parent / "models"
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "bookings_history.csv"


def _generate_synthetic(output_path: Path, days: int = 90, zones: list[str] | None = None) -> None:
    """Generate synthetic booking history for cold-start training."""

    if zones is None:
        zones = ["central", "north", "south", "east", "west"]

    np.random.seed(42)
    service_ids = [f"svc_{i:03d}" for i in range(1, 9)]
    records = []
    base = datetime.utcnow() - timedelta(days=days)

    for day_idx in range(days):
        current = base + timedelta(days=day_idx)
        weekday = current.weekday()
        month = current.month

        for zone in zones:
            for service_id in service_ids:
                base_jobs = np.random.poisson(lam=8)
                if weekday >= 5:
                    base_jobs += np.random.poisson(lam=3)
                if month in [4, 5, 6, 7, 8, 9]:
                    base_jobs += np.random.poisson(lam=2)

                records.append(
                    {
                        "date": current.date().isoformat(),
                        "service_id": service_id,
                        "zone": zone,
                        "jobs": max(0, base_jobs),
                    }
                )

    df = pd.DataFrame(records)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create time-based and lag features for demand forecasting."""

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    
    # Time-based features
    df["day_of_week"] = df["date"].dt.weekday
    df["month"] = df["date"].dt.month
    df["day_of_year"] = df["date"].dt.dayofyear
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["week_of_month"] = (df["date"].dt.day - 1) // 7 + 1
    
    # Cyclical encoding for day of week
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    
    # Cyclical encoding for month
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

    # Sort for proper lag calculation
    df = df.sort_values(["service_id", "zone", "date"])
    
    # Lag features (previous day's jobs)
    df["jobs_lag_1"] = df.groupby(["service_id", "zone"])["jobs"].shift(1).fillna(0)
    df["jobs_lag_7"] = df.groupby(["service_id", "zone"])["jobs"].shift(7).fillna(0)
    
    # Rolling averages
    df["rolling_7d"] = (
        df.groupby(["service_id", "zone"])["jobs"]
        .transform(lambda s: s.rolling(7, min_periods=1).mean())
    )
    df["rolling_14d"] = (
        df.groupby(["service_id", "zone"])["jobs"]
        .transform(lambda s: s.rolling(14, min_periods=1).mean())
    )

    # Encode categoricals
    df["service_id"] = df["service_id"].astype("category")
    df["zone"] = df["zone"].astype("category")

    return df


def train(data_path: Path, output_dir: Path) -> dict:
    """Train demand forecast model and persist artifacts."""

    # Ensure data exists
    if not data_path.exists():
        print(f"Data file {data_path} not found. Generating synthetic data...")
        _generate_synthetic(data_path)

    # Load and prepare data
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} records from {data_path}")
    
    df = build_features(df)

    feature_cols = [
        "day_of_week",
        "month",
        "day_of_year",
        "is_weekend",
        "week_of_month",
        "dow_sin",
        "dow_cos",
        "month_sin",
        "month_cos",
        "jobs_lag_1",
        "jobs_lag_7",
        "rolling_7d",
        "rolling_14d",
        "service_id",
        "zone",
    ]
    target_col = "jobs"

    X = df[feature_cols]
    y = df[target_col]

    # Split data - use time-based split for time series
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )

    print(f"Training on {len(X_train)} samples, testing on {len(X_test)} samples")

    # Train LightGBM model
    model = lgb.LGBMRegressor(
        objective="regression",
        n_estimators=200,
        learning_rate=0.05,
        max_depth=6,
        num_leaves=31,
        min_child_samples=20,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbose=-1,
    )

    model.fit(
        X_train, 
        y_train,
        eval_set=[(X_test, y_test)],
    )

    # Evaluate
    preds = model.predict(X_test)
    
    # Avoid division by zero in MAPE
    y_test_nonzero = y_test.replace(0, 0.1)
    mape = mean_absolute_percentage_error(y_test_nonzero, np.maximum(preds, 0.1))
    r2 = r2_score(y_test, preds)
    rmse = np.sqrt(np.mean((y_test - preds) ** 2))
    mae = np.mean(np.abs(y_test - preds))

    print(f"\nModel Performance:")
    print(f"  MAPE: {mape:.4f} (target < 0.25)")
    print(f"  R²: {r2:.4f} (target > 0.6)")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  MAE: {mae:.4f}")

    # Check acceptance criteria
    passed = mape < 0.25 and r2 > 0.6
    print(f"\nAcceptance criteria: {'PASSED ✓' if passed else 'FAILED ✗'}")

    # Save model
    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = output_dir / "demand_forecast_v1.pkl"
    joblib.dump(model, model_path)
    print(f"\nModel saved to {model_path}")

    # Save metadata
    metadata = {
        "version": "v1",
        "trained_at": datetime.utcnow().isoformat(),
        "mape": round(float(mape), 4),
        "r2": round(float(r2), 4),
        "rmse": round(float(rmse), 4),
        "mae": round(float(mae), 4),
        "features": feature_cols,
        "training_rows": len(X_train),
        "test_rows": len(X_test),
        "acceptance_criteria_passed": passed,
        "data_path": str(data_path),
    }

    metadata_path = output_dir / "demand_forecast_v1_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to {metadata_path}")

    # Save feature importance
    importance = pd.DataFrame({
        "feature": feature_cols,
        "importance": model.feature_importances_
    }).sort_values("importance", ascending=False)
    
    importance_path = output_dir / "feature_importance.csv"
    importance.to_csv(importance_path, index=False)
    print(f"Feature importance saved to {importance_path}")

    return {
        "model_path": str(model_path),
        "mape": float(mape),
        "r2": float(r2),
        "passed": passed
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train demand forecast model")
    parser.add_argument("--data", type=Path, default=DATA_PATH)
    parser.add_argument("--output-dir", type=Path, default=MODEL_DIR)
    args = parser.parse_args()

    result = train(args.data, args.output_dir)
    print("\n" + json.dumps(result, indent=2))

"""
Evaluate demand forecast model performance.

Usage:
    python ml/evaluate.py --model ml/models/demand_forecast_v1.pkl

Acceptance criteria (per PRD):
    - MAPE < 25%
    - R² > 0.6
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error, r2_score

MODEL_DIR = Path(__file__).resolve().parent / "models"
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "bookings_history.csv"


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


def evaluate(model_path: Path, data_path: Path, output_path: Path | None = None) -> dict:
    """Evaluate model and return metrics."""
    
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found at {model_path}")
    
    if not data_path.exists():
        raise FileNotFoundError(f"Data not found at {data_path}")

    # Load model and data
    model = joblib.load(model_path)
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
    
    # Use last 20% as test set (time-series style)
    split_idx = int(len(X) * 0.8)
    X_test = X.iloc[split_idx:]
    y_test = y.iloc[split_idx:]

    # Predict
    preds = model.predict(X_test)

    # Calculate metrics (avoid division by zero)
    y_test_safe = y_test.replace(0, 0.1)
    preds_safe = np.maximum(preds, 0.1)
    
    mape = mean_absolute_percentage_error(y_test_safe, preds_safe)
    r2 = r2_score(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = np.mean(np.abs(y_test - preds))
    
    # Per-zone analysis
    df_test = df.iloc[split_idx:].copy()
    df_test["predicted"] = preds
    zone_metrics = {}
    for zone in df_test["zone"].unique():
        zone_data = df_test[df_test["zone"] == zone]
        zone_mape = mean_absolute_percentage_error(
            zone_data["jobs"].replace(0, 0.1),
            np.maximum(zone_data["predicted"], 0.1)
        )
        zone_metrics[zone] = round(float(zone_mape), 4)
    
    # Per-service analysis
    service_metrics = {}
    for service in df_test["service_id"].unique():
        service_data = df_test[df_test["service_id"] == service]
        service_mape = mean_absolute_percentage_error(
            service_data["jobs"].replace(0, 0.1),
            np.maximum(service_data["predicted"], 0.1)
        )
        service_metrics[str(service)] = round(float(service_mape), 4)

    # Check acceptance criteria
    passed = mape < 0.25 and r2 > 0.6

    result = {
        "model": str(model_path.name),
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "test_rows": len(X_test),
        "metrics": {
            "mape": round(float(mape), 4),
            "r2": round(float(r2), 4),
            "rmse": round(float(rmse), 4),
            "mae": round(float(mae), 4),
        },
        "acceptance_criteria": {
            "mape_threshold": 0.25,
            "r2_threshold": 0.6,
            "passed": passed,
        },
        "zone_mape": zone_metrics,
        "service_mape": service_metrics,
    }

    # Print results
    print("\n" + "=" * 50)
    print("MODEL EVALUATION RESULTS")
    print("=" * 50)
    print(f"Model: {model_path.name}")
    print(f"Test samples: {len(X_test)}")
    print("\nOverall Metrics:")
    print(f"  MAPE: {mape:.4f} (threshold: < 0.25)")
    print(f"  R²: {r2:.4f} (threshold: > 0.6)")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  MAE: {mae:.4f}")
    print(f"\nAcceptance: {'PASSED ✓' if passed else 'FAILED ✗'}")
    print("\nPer-Zone MAPE:")
    for zone, mape_val in sorted(zone_metrics.items()):
        status = "✓" if mape_val < 0.25 else "✗"
        print(f"  {zone}: {mape_val:.4f} {status}")

    # Save results if output path provided
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\nResults saved to {output_path}")

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate demand forecast model")
    parser.add_argument("--model", type=Path, default=MODEL_DIR / "demand_forecast_v1.pkl")
    parser.add_argument("--data", type=Path, default=DATA_PATH)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()

    result = evaluate(args.model, args.data, args.output)
    
    if not result["acceptance_criteria"]["passed"]:
        raise SystemExit("Model did not meet acceptance criteria.")

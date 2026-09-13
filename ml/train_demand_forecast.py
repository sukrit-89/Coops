"""
Demand forecast training script.

Trains a LightGBM model to predict daily job count per service/zone
using synthetic + real booking history.
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
from sklearn.metrics import mean_absolute_percentage_error
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
 df.to_csv(output_path, index=False)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
 """Create time-based features for demand forecasting."""

 df = df.copy()
 df["date"] = pd.to_datetime(df["date"])
 df["day_of_week"] = df["date"].dt.weekday
 df["month"] = df["date"].dt.month
 df["day_of_year"] = df["date"].dt.dayofyear
 df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

 # Lag features
 df = df.sort_values(["service_id", "zone", "date"])
 df["jobs_lag_1"] = df.groupby(["service_id", "zone"])["jobs"].shift(1).fillna(0)
 df["jobs_lag_7"] = df.groupby(["service_id", "zone"])["jobs"].shift(7).fillna(0)
 df["rolling_7d"] = (
 df.groupby(["service_id", "zone"])["jobs"]
 .transform(lambda s: s.rolling(7, min_periods=1).mean())
 )

 # Encode categoricals
 df["service_id"] = df["service_id"].astype("category")
 df["zone"] = df["zone"].astype("category")

 return df


def train(data_path: Path, output_dir: Path) -> dict:
 """Train demand forecast model and persist artifacts."""

 if not data_path.exists():
 _generate_synthetic(data_path)

 df = pd.read_csv(data_path)
 df = build_features(df)

 feature_cols = [
 "day_of_week",
 "month",
 "day_of_year",
 "is_weekend",
 "jobs_lag_1",
 "jobs_lag_7",
 "rolling_7d",
 "service_id",
 "zone",
 ]
 target_col = "jobs"

 X = df[feature_cols]
 y = df[target_col]

 X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

 model = lgb.LGBMRegressor(
 objective="regression",
 n_estimators=200,
 learning_rate=0.05,
 max_depth=5,
 random_state=42,
 verbose=-1,
 )

 model.fit(X_train, y_train)
 preds = model.predict(X_test)
 mape = mean_absolute_percentage_error(y_test, preds)

 output_dir.mkdir(parents=True, exist_ok=True)
 joblib.dump(model, output_dir / "demand_forecast_v1.pkl")

 with open(output_dir / "demand_forecast_v1_metadata.json", "w") as f:
 json.dump(
 {
 "version": "v1",
 "trained_at": datetime.utcnow().isoformat(),
 "mape": round(float(mape), 4),
 "features": feature_cols,
 "training_rows": len(X_train),
 "test_rows": len(X_test),
 },
 f,
 indent=2,
 )

 return {"model_path": str(output_dir / "demand_forecast_v1.pkl"), "mape": float(mape)}


if __name__ == "__main__":
 parser = argparse.ArgumentParser(description="Train demand forecast model")
 parser.add_argument("--data", type=Path, default=DATA_PATH)
 parser.add_argument("--output-dir", type=Path, default=MODEL_DIR)
 args = parser.parse_args()

 result = train(args.data, args.output_dir)
 print(json.dumps(result, indent=2))

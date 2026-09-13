"""
Evaluate demand forecast model performance.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import lightgbm as lgb
import pandas as pd
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error
from sklearn.model_selection import train_test_split

from train_demand_forecast import build_features, _generate_synthetic

MODEL_DIR = Path(__file__).resolve().parent / "models"
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "bookings_history.csv"


def evaluate(model_path: Path, data_path: Path) -> dict:
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
 _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

 model = joblib.load(model_path)
 preds = model.predict(X_test)

 mape = mean_absolute_percentage_error(y_test, preds)
 rmse = mean_squared_error(y_test, preds, squared=False)
 mae = float(np.mean(np.abs(y_test - preds)))

 result = {
 "model": str(model_path.name),
 "mape": round(float(mape), 4),
 "rmse": round(float(rmse), 4),
 "mae": round(float(mae), 4),
 "test_rows": len(X_test),
 "acceptance_criteria_mape": 0.25,
 "passed": bool(mape < 0.25),
 }

 print(json.dumps(result, indent=2))
 return result


if __name__ == "__main__":
 import numpy as np
 result = evaluate(MODEL_DIR / "demand_forecast_v1.pkl", DATA_PATH)
 if not result["passed"]:
 raise SystemExit("Model did not meet MAPE acceptance criteria.")

"""
Kaarya ML Inference Service

Designed to run on HuggingFace Spaces (CPU).
Endpoints:
 - POST /forecast/demand
 - POST /allocate
"""

from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

MODEL_PATH = Path(__file__).resolve().parent / "models" / "demand_forecast_v1.pkl"
model = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None

app = FastAPI(title="Kaarya ML Inference")


class ForecastRequest(BaseModel):
 service_id: str
 zone: str
 days: int = 7


class ForecastResponse(BaseModel):
 service_id: str
 zone: str
 generated_at: str
 predictions: list[dict]


class AllocationRequest(BaseModel):
 jobs: list[dict]
 workers: list[dict]


class AllocationResponse(BaseModel):
 assignments: list[dict]


@app.get("/health")
def health() -> dict:
 return {"status": "ok", "model_loaded": model is not None}


@app.post("/forecast/demand", response_model=ForecastResponse)
def forecast_demand(request: ForecastRequest) -> ForecastResponse:
 if model is None:
 raise RuntimeError("Model not loaded.")

 rows = []
 base = datetime.utcnow().date()
 for i in range(request.days):
 current = base + timedelta(days=i)
 rows.append(
 {
 "date": current.isoformat(),
 "service_id": request.service_id,
 "zone": request.zone,
 "jobs": 0,
 }
 )

 df = pd.DataFrame(rows)
 df["date"] = pd.to_datetime(df["date"])
 df["day_of_week"] = df["date"].dt.weekday
 df["month"] = df["date"].dt.month
 df["day_of_year"] = df["date"].dt.dayofyear
 df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
 df["jobs_lag_1"] = 0
 df["jobs_lag_7"] = 0
 df["rolling_7d"] = 0.0
 df["service_id"] = df["service_id"].astype("category")
 df["zone"] = df["zone"].astype("category")

 features = [
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
 preds = model.predict(df[features])

 predictions = []
 for i, row in df.iterrows():
 predictions.append(
 {
 "forecast_date": row["date"].date().isoformat(),
 "predicted_jobs": max(0, round(float(preds[i]), 2)),
 }
 )

 return ForecastResponse(
 service_id=request.service_id,
 zone=request.zone,
 generated_at=datetime.utcnow().isoformat(),
 predictions=predictions,
 )


@app.post("/allocate", response_model=AllocationResponse)
def allocate_workers(request: AllocationRequest) -> AllocationResponse:
 """
 Deterministic allocation heuristic.
 Replace with OR-Tools ILP when scale justifies it.
 """

 scored_workers = []
 for worker in request.workers:
 distance = float(worker.get("distance_km", 999))
 availability = 1.0 if worker.get("is_available") else 0.0
 rating = float(worker.get("average_rating", 0.0)) / 5.0
 experience = min(float(worker.get("years_experience", 0.0)), 10.0) / 10.0
 skill_match = 1.0 if worker.get("skill_match") else 0.0

 score = (
 skill_match * 30
 + max(0.0, 20 - min(distance, 20))
 + availability * 20
 + rating * 15
 + experience * 10
 + 5
 )

 scored_workers.append({**worker, "score": score})

 scored_workers.sort(key=lambda item: item["score"], reverse=True)
 assignments = []
 assigned_worker_ids: set[str] = set()

 for job in request.jobs:
 for worker in scored_workers:
 if worker["worker_id"] in assigned_worker_ids:
 continue
 if not worker.get("is_available"):
 continue
 assignments.append(
 {
 "job_id": job.get("id"),
 "worker_id": worker["worker_id"],
 "score": worker["score"],
 "distance_km": worker.get("distance_km"),
 }
 )
 assigned_worker_ids.add(worker["worker_id"])
 break

 return AllocationResponse(assignments=assignments)

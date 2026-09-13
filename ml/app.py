"""
Kaarya ML Inference Service

Designed to run on HuggingFace Spaces (CPU free tier).

Endpoints:
    POST /forecast/demand - Predict demand for service/zone
    POST /allocate - Assign workers to jobs using ILP
    GET /health - Health check
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from ortools.sat.python import cp_model

# Model path - will be mounted in HF Space
MODEL_PATH = Path(__file__).resolve().parent / "models" / "demand_forecast_v1.pkl"

# Try to load model at startup
try:
    model = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else None
except Exception as e:
    print(f"Warning: Could not load model: {e}")
    model = None

app = FastAPI(
    title="Kaarya ML Inference",
    description="Demand forecasting and worker allocation API for Kaarya platform",
    version="1.0.0",
)


# ============================================================================
# Request/Response Models
# ============================================================================

class ForecastRequest(BaseModel):
    service_id: str = Field(..., description="Service ID to forecast")
    zone: str = Field(..., description="Zone to forecast")
    days: int = Field(default=7, ge=1, le=30, description="Number of days to forecast")
    historical_avg: float | None = Field(default=None, description="Historical average for this service/zone")


class ForecastPrediction(BaseModel):
    forecast_date: str
    predicted_jobs: float
    confidence_low: float
    confidence_high: float


class ForecastResponse(BaseModel):
    service_id: str
    zone: str
    generated_at: str
    model_version: str
    predictions: list[ForecastPrediction]


class Job(BaseModel):
    id: str
    service_id: str
    zone: str
    location_lat: float | None = None
    location_lng: float | None = None
    scheduled_at: str | None = None
    priority: int = Field(default=1, ge=1, le=5)


class Worker(BaseModel):
    worker_id: str
    skills: list[str] = Field(default_factory=list)
    is_available: bool = True
    location_lat: float | None = None
    location_lng: float | None = None
    distance_km: float | None = None
    average_rating: float = Field(default=0.0, ge=0, le=5)
    years_experience: float = Field(default=0.0, ge=0)
    trust_score: float = Field(default=0.5, ge=0, le=1)
    skill_match: bool = False
    max_jobs_per_day: int = Field(default=5, ge=1)


class AllocationRequest(BaseModel):
    jobs: list[Job]
    workers: list[Worker]
    max_distance_km: float = Field(default=10.0, description="Max assignment distance")
    prefer_experience: bool = Field(default=True, description="Weight experience higher")


class Assignment(BaseModel):
    job_id: str
    worker_id: str
    score: float
    distance_km: float | None


class AllocationResponse(BaseModel):
    assignments: list[Assignment]
    unassigned_jobs: list[str]
    solver_status: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str | None
    timestamp: str


# ============================================================================
# Feature Building
# ============================================================================

def build_inference_features(
    service_id: str, 
    zone: str, 
    days: int,
    historical_avg: float | None = None,
) -> pd.DataFrame:
    """Build feature DataFrame for inference."""
    
    rows = []
    base = datetime.now(timezone.utc).date()
    
    for i in range(days):
        current = base + timedelta(days=i)
        rows.append({
            "date": current.isoformat(),
            "service_id": service_id,
            "zone": zone,
            "jobs": 0,  # Placeholder, not used for prediction
        })

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    
    # Time-based features
    df["day_of_week"] = df["date"].dt.weekday
    df["month"] = df["date"].dt.month
    df["day_of_year"] = df["date"].dt.dayofyear
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["week_of_month"] = (df["date"].dt.day - 1) // 7 + 1
    
    # Cyclical encoding
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
    
    # Lag features - use historical average if provided, else 0
    lag_value = historical_avg if historical_avg is not None else 0.0
    df["jobs_lag_1"] = lag_value
    df["jobs_lag_7"] = lag_value
    df["rolling_7d"] = lag_value
    df["rolling_14d"] = lag_value
    
    # Categoricals
    df["service_id"] = df["service_id"].astype("category")
    df["zone"] = df["zone"].astype("category")
    
    return df


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
        model_version="v1" if model is not None else None,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/forecast/demand", response_model=ForecastResponse)
def forecast_demand(request: ForecastRequest) -> ForecastResponse:
    """
    Predict demand for next N days.
    
    Uses trained LightGBM model for predictions with confidence intervals.
    Falls back to simple heuristic if model not loaded.
    """
    
    if model is None:
        # Fallback to rule-based prediction
        return _rule_based_forecast(request)
    
    # Build features
    df = build_inference_features(
        request.service_id,
        request.zone,
        request.days,
        request.historical_avg,
    )
    
    features = [
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
    
    # Predict
    try:
        preds = model.predict(df[features])
    except Exception as e:
        print(f"Prediction error: {e}")
        return _rule_based_forecast(request)
    
    # Build response with confidence intervals (±20% of prediction)
    predictions = []
    for i, row in df.iterrows():
        pred = max(0, float(preds[i]))
        predictions.append(ForecastPrediction(
            forecast_date=row["date"].date().isoformat(),
            predicted_jobs=round(pred, 2),
            confidence_low=round(pred * 0.8, 2),
            confidence_high=round(pred * 1.2, 2),
        ))
    
    return ForecastResponse(
        service_id=request.service_id,
        zone=request.zone,
        generated_at=datetime.now(timezone.utc).isoformat(),
        model_version="v1",
        predictions=predictions,
    )


def _rule_based_forecast(request: ForecastRequest) -> ForecastResponse:
    """Simple rule-based fallback for forecasting."""
    
    predictions = []
    base = datetime.now(timezone.utc).date()
    base_demand = request.historical_avg if request.historical_avg else 10.0
    
    for i in range(request.days):
        current = base + timedelta(days=i)
        weekday = current.weekday()
        month = current.month
        
        # Weekend boost
        demand = base_demand * (1.3 if weekday >= 5 else 1.0)
        
        # Summer boost
        if month in [5, 6, 7, 8]:
            demand *= 1.2
        
        # Add noise
        demand = max(0, demand * np.random.uniform(0.9, 1.1))
        
        predictions.append(ForecastPrediction(
            forecast_date=current.isoformat(),
            predicted_jobs=round(demand, 2),
            confidence_low=round(demand * 0.7, 2),
            confidence_high=round(demand * 1.3, 2),
        ))
    
    return ForecastResponse(
        service_id=request.service_id,
        zone=request.zone,
        generated_at=datetime.now(timezone.utc).isoformat(),
        model_version="rule-based",
        predictions=predictions,
    )


@app.post("/allocate", response_model=AllocationResponse)
def allocate_workers(request: AllocationRequest) -> AllocationResponse:
    """
    Optimally assign workers to jobs using OR-Tools CP-SAT solver.
    
    Optimization objectives:
    - Maximize skill match
    - Minimize travel distance
    - Prefer higher-rated workers
    - Balance workload across workers
    
    Falls back to greedy heuristic for large inputs or solver failures.
    """
    
    jobs = request.jobs
    workers = request.workers
    
    # Filter available workers
    available_workers = [w for w in workers if w.is_available]
    
    if not jobs:
        return AllocationResponse(
            assignments=[],
            unassigned_jobs=[],
            solver_status="no_jobs",
        )
    
    if not available_workers:
        return AllocationResponse(
            assignments=[],
            unassigned_jobs=[j.id for j in jobs],
            solver_status="no_available_workers",
        )
    
    # For small instances, use ILP solver
    if len(jobs) <= 50 and len(available_workers) <= 50:
        try:
            return _ilp_allocation(jobs, available_workers, request)
        except Exception as e:
            print(f"ILP solver failed: {e}")
    
    # Fallback to greedy heuristic
    return _greedy_allocation(jobs, available_workers, request)


def _ilp_allocation(
    jobs: list[Job],
    workers: list[Worker],
    request: AllocationRequest,
) -> AllocationResponse:
    """
    Integer Linear Programming allocation using OR-Tools CP-SAT.
    
    Variables:
        x[i,j] = 1 if worker j is assigned to job i
    
    Constraints:
        - Each job assigned to at most one worker
        - Each worker assigned to at most max_jobs_per_day jobs
        - Assignment respects max distance
    
    Objective:
        Maximize total score (weighted by rating, experience, skill match)
    """
    
    model = cp_model.CpModel()
    
    num_jobs = len(jobs)
    num_workers = len(workers)
    
    # Decision variables: x[i,j] = 1 if worker j assigned to job i
    x = {}
    for i in range(num_jobs):
        for j in range(num_workers):
            x[i, j] = model.new_bool_var(f"x_{i}_{j}")
    
    # Calculate score matrix
    scores = np.zeros((num_jobs, num_workers))
    distances = np.zeros((num_jobs, num_workers))
    
    for i, job in enumerate(jobs):
        for j, worker in enumerate(workers):
            # Base score from worker attributes
            score = 0.0
            
            # Skill match (30 points)
            if worker.skill_match or job.service_id in worker.skills:
                score += 30
            
            # Distance score (20 points max, decreases with distance)
            dist = worker.distance_km if worker.distance_km is not None else 10.0
            if job.location_lat and job.location_lng and worker.location_lat and worker.location_lng:
                # Calculate actual distance (simplified)
                dist = _haversine(
                    job.location_lat, job.location_lng,
                    worker.location_lat, worker.location_lng
                )
            distances[i, j] = dist
            score += max(0, 20 - dist)
            
            # Rating score (15 points max)
            score += (worker.average_rating / 5.0) * 15
            
            # Experience score (10 points max)
            exp_years = min(worker.years_experience, 10)
            score += (exp_years / 10.0) * 10
            
            # Trust score (5 points max)
            score += worker.trust_score * 5
            
            # Priority bonus
            score += job.priority
            
            scores[i, j] = score
    
    # Convert to integers for CP-SAT (scale by 100)
    int_scores = (scores * 100).astype(int)
    
    # Constraint: Each job assigned to at most one worker
    for i in range(num_jobs):
        model.add(sum(x[i, j] for j in range(num_workers)) <= 1)
    
    # Constraint: Each worker assigned to at most max_jobs_per_day jobs
    for j, worker in enumerate(workers):
        model.add(sum(x[i, j] for i in range(num_jobs)) <= worker.max_jobs_per_day)
    
    # Constraint: Don't assign if distance exceeds max
    for i in range(num_jobs):
        for j in range(num_workers):
            if distances[i, j] > request.max_distance_km:
                model.add(x[i, j] == 0)
    
    # Objective: Maximize total score
    model.maximize(
        sum(x[i, j] * int_scores[i, j] for i in range(num_jobs) for j in range(num_workers))
    )
    
    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0  # Limit solve time
    status = solver.solve(model)
    
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise RuntimeError(f"Solver status: {solver.status_name(status)}")
    
    # Extract assignments
    assignments = []
    assigned_jobs = set()
    
    for i in range(num_jobs):
        for j in range(num_workers):
            if solver.value(x[i, j]) == 1:
                assignments.append(Assignment(
                    job_id=jobs[i].id,
                    worker_id=workers[j].worker_id,
                    score=round(scores[i, j], 2),
                    distance_km=round(distances[i, j], 2),
                ))
                assigned_jobs.add(jobs[i].id)
    
    unassigned = [j.id for j in jobs if j.id not in assigned_jobs]
    
    return AllocationResponse(
        assignments=assignments,
        unassigned_jobs=unassigned,
        solver_status=solver.status_name(status),
    )


def _greedy_allocation(
    jobs: list[Job],
    workers: list[Worker],
    request: AllocationRequest,
) -> AllocationResponse:
    """Greedy heuristic allocation for large instances."""
    
    # Score workers
    scored_workers = []
    for worker in workers:
        distance = worker.distance_km if worker.distance_km is not None else 10.0
        score = (
            (1.0 if worker.skill_match else 0.0) * 30
            + max(0, 20 - distance)
            + (worker.average_rating / 5.0) * 15
            + min(worker.years_experience / 10.0, 1.0) * 10
            + worker.trust_score * 5
        )
        scored_workers.append((worker, score, distance))
    
    # Sort by score descending
    scored_workers.sort(key=lambda x: x[1], reverse=True)
    
    # Greedy assignment
    assignments = []
    worker_job_count: dict[str, int] = {}
    assigned_jobs: set[str] = set()
    
    for job in jobs:
        for worker, score, distance in scored_workers:
            if distance > request.max_distance_km:
                continue
            
            count = worker_job_count.get(worker.worker_id, 0)
            if count >= worker.max_jobs_per_day:
                continue
            
            assignments.append(Assignment(
                job_id=job.id,
                worker_id=worker.worker_id,
                score=round(score, 2),
                distance_km=round(distance, 2),
            ))
            worker_job_count[worker.worker_id] = count + 1
            assigned_jobs.add(job.id)
            break
    
    unassigned = [j.id for j in jobs if j.id not in assigned_jobs]
    
    return AllocationResponse(
        assignments=assignments,
        unassigned_jobs=unassigned,
        solver_status="greedy_heuristic",
    )


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate haversine distance between two points in km."""
    R = 6371  # Earth radius in km
    
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    
    return R * c


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)

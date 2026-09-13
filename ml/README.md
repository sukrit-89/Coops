# Kaarya ML Pipeline

Machine learning pipeline for demand forecasting and worker allocation optimization.

## Overview

The ML pipeline provides two core capabilities:

1. **Demand Forecasting** - Predicts daily job count per service/zone using LightGBM
2. **Worker Allocation** - Optimally assigns workers to jobs using OR-Tools ILP solver

## Quick Start

### Prerequisites

```bash
# Create virtual environment
python3 -m venv ml/venv
source ml/venv/bin/activate  # Linux/Mac
# or
.\ml\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r ml/requirements.txt
```

### Step 1: Generate Synthetic Data

```bash
python scripts/generate_synthetic_bookings.py
```

Output: `data/bookings_history.csv` (~3,600 rows covering 90 days)

### Step 2: Train the Model

```bash
python ml/train_demand_forecast.py
```

Expected output:
- `ml/models/demand_forecast_v1.pkl` — trained LightGBM model
- `ml/models/demand_forecast_v1_metadata.json` — training metrics
- `ml/models/feature_importance.csv` — feature importance ranking

### Step 3: Evaluate the Model

```bash
python ml/evaluate.py
```

**Acceptance Criteria (per PRD v2.0):**
- MAPE < 25%
- R² > 0.6

### Step 4: Test the Inference API

```bash
# Start the API locally
cd ml && uvicorn app:app --host 0.0.0.0 --port 7860

# In another terminal, test endpoints
curl http://localhost:7860/health

curl -X POST http://localhost:7860/forecast/demand \
  -H "Content-Type: application/json" \
  -d '{"service_id": "svc_001", "zone": "central", "days": 7}'

curl -X POST http://localhost:7860/allocate \
  -H "Content-Type: application/json" \
  -d '{"jobs": [{"id": "j1", "service_id": "plumbing", "zone": "central"}], "workers": [{"worker_id": "w1", "skills": ["plumbing"], "is_available": true, "average_rating": 4.5}]}'
```

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "model_version": "v1",
  "timestamp": "2026-09-13T00:00:00Z"
}
```

### POST /forecast/demand

Predict demand for a service/zone combination.

**Request:**
```json
{
  "service_id": "svc_001",
  "zone": "central",
  "days": 7,
  "historical_avg": 12.5  // optional
}
```

**Response:**
```json
{
  "service_id": "svc_001",
  "zone": "central",
  "generated_at": "2026-09-13T00:00:00Z",
  "model_version": "v1",
  "predictions": [
    {
      "forecast_date": "2026-09-14",
      "predicted_jobs": 15.2,
      "confidence_low": 12.2,
      "confidence_high": 18.2
    }
  ]
}
```

### POST /allocate

Assign workers to jobs using ILP optimization.

**Request:**
```json
{
  "jobs": [
    {
      "id": "j1",
      "service_id": "plumbing",
      "zone": "central",
      "priority": 3
    }
  ],
  "workers": [
    {
      "worker_id": "w1",
      "skills": ["plumbing"],
      "is_available": true,
      "distance_km": 2.5,
      "average_rating": 4.5,
      "years_experience": 3,
      "trust_score": 0.85
    }
  ],
  "max_distance_km": 10
}
```

**Response:**
```json
{
  "assignments": [
    {
      "job_id": "j1",
      "worker_id": "w1",
      "score": 75.5,
      "distance_km": 2.5
    }
  ],
  "unassigned_jobs": [],
  "solver_status": "OPTIMAL"
}
```

## Deployment to HuggingFace Space

1. Create a new Space on HuggingFace (type: Docker)
2. Push the `ml/` directory to the Space repository
3. The Space will auto-deploy using the provided Dockerfile

**Space URL:** `https://huggingface.co/spaces/kaarya/ml-inference`

### Configure Backend

Set the `ML_INFERENCE_URL` environment variable:
```
ML_INFERENCE_URL=https://kaarya-ml-inference.hf.space
```

## Model Architecture

### Demand Forecasting

**Algorithm:** LightGBM Regressor

**Features:**
- Time features: day_of_week, month, day_of_year, is_weekend, week_of_month
- Cyclical encoding: dow_sin, dow_cos, month_sin, month_cos
- Lag features: jobs_lag_1, jobs_lag_7
- Rolling averages: rolling_7d, rolling_14d
- Categorical: service_id, zone

**Hyperparameters:**
- n_estimators: 200
- learning_rate: 0.05
- max_depth: 6
- num_leaves: 31

### Worker Allocation

**Algorithm:** OR-Tools CP-SAT (Constraint Programming SAT solver)

**Scoring Function:**
```
score = skill_match * 30
      + max(0, 20 - distance_km)
      + (rating / 5) * 15
      + min(experience / 10, 1) * 10
      + trust_score * 5
      + priority
```

**Constraints:**
- Each job assigned to at most one worker
- Each worker assigned to at most `max_jobs_per_day` jobs
- Distance must be within `max_distance_km`

**Fallback:** Greedy heuristic for large instances (>50 jobs or workers)

## Fallback Behavior

If the ML service is unreachable, the backend automatically falls back to:
- **Demand forecasting:** Rule-based predictions using day-of-week and seasonal patterns
- **Allocation:** Greedy heuristic based on the same scoring function

## File Structure

```
ml/
├── app.py                    # FastAPI inference API
├── train_demand_forecast.py  # Training script
├── evaluate.py               # Evaluation script
├── requirements.txt          # Python dependencies
├── Dockerfile                # HuggingFace Space deployment
├── README.md                 # This file
└── models/
    ├── demand_forecast_v1.pkl           # Trained model
    ├── demand_forecast_v1_metadata.json # Training metrics
    └── feature_importance.csv           # Feature importance
```

## Current Model Performance

**Latest Training Results (2026-09-13):**

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| MAPE | 12.75% | < 25% | ✓ PASS |
| R² | 0.734 | > 0.6 | ✓ PASS |
| RMSE | 1.107 | - | - |
| MAE | 0.873 | - | - |

**Per-Zone MAPE:**
- central: 11.62%
- east: 16.16%
- north: 12.92%
- south: 11.57%
- west: 12.62%

## Retraining

To retrain with new data:

1. Update `data/bookings_history.csv` with new booking records
2. Run `python ml/train_demand_forecast.py`
3. Verify acceptance criteria with `python ml/evaluate.py`
4. Push updated model to HuggingFace Space

Recommended retraining frequency: Monthly or when MAPE exceeds 20%.

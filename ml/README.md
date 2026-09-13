# Kaarya ML Pipeline

## Overview

Free-tier compliant ML pipeline for demand forecasting and worker allocation.

## Structure

```
ml/
 ├── app.py # FastAPI inference service (HuggingFace Space)
 ├── train_demand_forecast.py # LightGBM training script
 ├── evaluate.py # Model evaluation + acceptance criteria
 └── requirements.txt # Python dependencies

scripts/
 └── generate_synthetic_bookings.py # Cold-start synthetic data

models/
 └── demand_forecast_v1.pkl # Trained model (gitignored, too large)
```

## Quick Start

```bash
cd ml
pip install -r requirements.txt

# Generate synthetic training data
python scripts/generate_synthetic_bookings.py

# Train model
python ml/train_demand_forecast.py

# Evaluate
python ml/evaluate.py

# Run inference API
uvicorn app:app --host 0.0.0.0 --port 7860
```

## HuggingFace Space Deployment

1. Create a new Space at https://huggingface.co/spaces
2. Select "FastAPI" SDK
3. Push this entire `ml/` directory
4. The Space will auto-deploy and expose the API

## Model Acceptance Criteria

- MAPE < 25% on holdout set
- RMSE < 5 jobs/day
- Model evaluated weekly against real data

## API Endpoints

- `POST /forecast/demand` — Predict demand for next N days
- `POST /allocate` — Assign workers to jobs
- `GET /health` — Health check

## Environment Variables

- `ML_INFERENCE_URL` — HuggingFace Space URL (backend only)

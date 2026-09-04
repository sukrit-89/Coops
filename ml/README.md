# Coops Matching Service

This service trains a worker-match model from labeled booking outcomes and serves predictions. It intentionally has no demo dataset.

## Run

```bash
cd ml
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn service:app --reload --port 8001
```

## Train

`POST /train` with at least 10 labeled examples containing successful and unsuccessful outcomes. Feature values must be normalized between 0 and 1.

## Predict

`POST /predict` with the six matching features. The endpoint returns `503` until a real model has been trained.

The production Next.js matching route remains the explainable fallback until this service has a validated model and a monitored deployment.

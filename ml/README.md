# ML Pipeline Setup Guide

## Training the Demand Forecast Model

### Prerequisites
```bash
python -m venv ml/venv
source ml/venv/bin/activate # Linux/Mac
# or
.\ml\venv\Scripts\activate # Windows

pip install -r ml/requirements.txt
```

### Step 1: Generate Synthetic Data (if no real data)
```bash
python scripts/generate_synthetic_bookings.py --output data/bookings.csv --count 10000
```

### Step 2: Train the Model
```bash
python ml/train_demand_forecast.py \
 --data data/bookings.csv \
 --output models/demand_forecast_v1.pkl \
 --model-type lightgbm
```

Expected output:
- `models/demand_forecast_v1.pkl` — trained model
- `models/metrics.json` — evaluation metrics
- `models/feature_importance.png` — visualization

### Step 3: Evaluate the Model
```bash
python ml/evaluate.py \
 --model models/demand_forecast_v1.pkl \
 --data data/bookings.csv \
 --output evaluation_results.json
```

Acceptance criteria:
- MAPE < 25%
- RMSE < 20% of mean demand
- R² > 0.6

### Step 4: Deploy to HuggingFace Space

1. Create a new Space on HuggingFace (type: Docker)
2. Push the `ml/` directory to the Space
3. Set environment variables in Space settings:
 - `PORT=7860`
 - `MODEL_PATH=/app/models/demand_forecast_v1.pkl`
4. The Space will auto-deploy

### Step 5: Configure Backend

Set the `ML_INFERENCE_URL` environment variable to your HuggingFace Space URL:
```
ML_INFERENCE_URL=https://<username>-demand-forecast.hf.space
```

### Fallback Behavior

If the ML service is unreachable, the system automatically falls back to rule-based matching and historical averages for forecasting.

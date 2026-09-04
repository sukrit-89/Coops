from pathlib import Path
from typing import Literal

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier

MODEL_PATH = Path(__file__).with_name("worker_match_model.joblib")
app = FastAPI(title="Coops Worker Matching Service", version="1.0.0")


class MatchFeatures(BaseModel):
    skill_match: float = Field(ge=0, le=1)
    distance_score: float = Field(ge=0, le=1)
    availability_match: float = Field(ge=0, le=1)
    rating_score: float = Field(ge=0, le=1)
    experience_score: float = Field(ge=0, le=1)
    requirement_match: float = Field(ge=0, le=1)


class TrainingExample(MatchFeatures):
    outcome: Literal[0, 1]


class TrainRequest(BaseModel):
    examples: list[TrainingExample] = Field(min_length=10)


@app.get("/health")
def health() -> dict[str, bool]:
    return {"model_ready": MODEL_PATH.exists()}


@app.post("/train")
def train(request: TrainRequest) -> dict[str, int | str]:
    labels = [example.outcome for example in request.examples]
    if len(set(labels)) < 2:
        raise HTTPException(status_code=422, detail="Training data must contain successful and unsuccessful outcomes.")

    features = [list(example.model_dump(exclude={"outcome"}).values()) for example in request.examples]
    model = RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")
    model.fit(features, labels)
    joblib.dump(model, MODEL_PATH)
    return {"status": "trained", "examples": len(request.examples)}


@app.post("/predict")
def predict(features: MatchFeatures) -> dict[str, float | str]:
    if not MODEL_PATH.exists():
        raise HTTPException(status_code=503, detail="Matching model is not trained. Provide labeled booking outcomes to /train first.")

    model: RandomForestClassifier = joblib.load(MODEL_PATH)
    values = [list(features.model_dump().values())]
    probability = float(model.predict_proba(values)[0][1])
    return {"recommendation_score": round(probability, 6), "model": "random_forest"}

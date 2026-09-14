# CooperativeConnect — Machine Learning Master Documentation

> **Purpose**: This document is your single source of truth for every ML/AI feature in the CooperativeConnect platform. Read this end-to-end before any technical panel review. It covers architecture, algorithms, inputs/outputs, fallbacks, integrations, metrics, and how to demo each feature.

---

## Table of Contents

1. [ML Philosophy & Architecture](#1-ml-philosophy--architecture)
2. [Demand Forecasting](#2-demand-forecasting)
3. [Worker Matching & Ranking](#3-worker-matching--ranking)
4. [OR-Tools ILP Allocation](#4-or-tools-ilp-allocation)
5. [Cancellation Risk Prediction](#5-cancellation-risk-prediction)
6. [Fraud Detection](#6-fraud-detection)
7. [Skill Gap Analysis](#7-skill-gap-analysis)
8. [Trust Score](#8-trust-score)
9. [Availability Scheduling](#9-availability-scheduling)
10. [Alerts Engine](#10-alerts-engine)
11. [API Surface](#11-api-surface)
12. [Cron & Automation](#12-cron--automation)
13. [Database Schema](#13-database-schema)
14. [Performance Metrics](#14-performance-metrics)
15. [Demo Script for the Panel](#15-demo-script-for-the-panel)

---

## 1. ML Philosophy & Architecture

### 1.1 Hybrid Approach

CooperativeConnect uses a **hybrid ML architecture**: a Python ML service (HuggingFace Space) for heavy inference, with deterministic **rule-based fallbacks** in TypeScript for when the Python service is down or unreachable.

```
┌──────────────────────┐
│ Next.js Frontend │
└──────────┬───────────┘
 │
┌──────────▼───────────┐
│  API Routes (Vercel) │ ← /api/matching, /api/allocation, /api/forecast/*
└──────────┬───────────┘
 │
┌──────────▼───────────┐
│ Service Layer (TS) │ ← src/lib/services/ml.ts, forecasts.ts
└──────────┬───────────┘
 │
 ┌───────┴────────┐
 │ │
┌───▼─────┐ ┌─────▼──────┐
│ Rule- │ │ Python ML │
│ Based │ │ Service │
│ (TS) │ │ (HF Space)│
└─────────┘ └────────────┘
 Always Fallback
 works if 200 OK
```

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Fail-soft** | Every ML call has a deterministic TypeScript fallback. The app never breaks if the Python service is down. |
| **Cooperative-scoped** | All ML outputs (forecasts, allocations, predictions) are scoped to the user's cooperative where applicable — no cross-cooperative data leakage. |
| **Explainable** | Every score, factor, and recommendation comes with a clear breakdown the platform can show to admins, workers, and customers. |
| **Fast** | All ML inference has a **5-second timeout**. The app moves on if the model is slow. |
| **Auditable** | Every forecast stores `model_version` so we know if a prediction came from LightGBM or the rule-based fallback. |

### 1.3 ML Service Configuration

- **URL**: `process.env.ML_INFERENCE_URL` (default: `http://localhost:7860` — local dev)
- **Production**: HuggingFace Space (Python Gradio app with LightGBM + OR-Tools)
- **Timeout**: 5 seconds (`ML_TIMEOUT_MS`)
- **Endpoints exposed**:
 - `GET /health` — health check
 - `POST /forecast/demand` — demand forecasting
 - `POST /allocate` — worker-job allocation

### 1.4 Code Locations

| Component | File |
|-----------|------|
| ML types & Zod schemas | `src/lib/domain/ml.ts` |
| ML service (TS proxy) | `src/lib/services/ml.ts` |
| Rule-based fallbacks | `src/lib/services/ml.ts` (bottom) |
| Forecast service (DB) | `src/lib/services/forecasts.ts` |
| Matching ranking | `src/lib/domain/matching.ts` |
| Trust score formula | `src/lib/domain/trust-score.ts` |
| Cancellation factors | `src/lib/domain/cancellation-prediction.ts` |
| Fraud signals | `src/lib/domain/fraud-detection.ts` |
| Skill gap analyzer | `src/lib/services/skill-gap.ts` |
| Availability schemas | `src/lib/domain/availability.ts` |
| Booking state machine | `src/lib/domain/booking-status.ts` |

---

## 2. Demand Forecasting

### 2.1 Purpose

Predict **how many service requests** will come in for a given **(service_id, zone)** pair over the next 7 days. Used for:
- Worker capacity planning (cooperative admin dashboards)
- Demand-driven pricing
- "Trending services" UI on landing
- Skill gap analysis (forecast vs supply)

### 2.2 Model

- **Algorithm**: LightGBM regressor (gradient-boosted decision trees)
- **Training**: Offline batch training in Python (HF Space)
- **Inference**: Real-time, per request
- **Reported accuracy** (per PRD): **MAPE 12.75%, R² 0.734**

### 2.3 Features Used (Python side)

The Python model uses these features (assumed from PRD §5.2):

| Feature | Description |
|---------|-------------|
| `service_id` | Which service (electrical, plumbing, etc.) |
| `zone` | Geographic/category zone |
| `day_of_week` | One-hot encoding (Mon–Sun) |
| `month` | One-hot or cyclical encoding |
| `historical_avg` | Rolling 30-day average booking count |
| `is_holiday` | Boolean for local holidays |
| `weather` | Optional: rain/temperature bin (if integrated) |

### 2.4 Request Format

**Endpoint**: `POST /api/forecast/demand`

**Input**:
```json
{
 "service_id": "uuid",
 "zone": "central",
 "days": 7,
 "historical_avg": 12.4
}
```

**Output**:
```json
{
 "serviceId": "uuid",
 "zone": "central",
 "generatedAt": "2026-09-16T10:00:00Z",
 "modelVersion": "lgbm-v1.2",
 "predictions": [
 {
 "forecastDate": "2026-09-17",
 "predictedJobs": 12,
 "confidenceLow": 9,
 "confidenceHigh": 15
 },
 /* ... 6 more days ... */
 ],
 "points": [
 {
 "date": "2026-09-17",
 "forecasted_demand": 12,
 "confidence": 0.8
 }
 ],
 "source": "ml" | "rule-based"
}
```

### 2.5 Database Storage

Forecasts are upserted into `demand_forecasts` with the unique key `(service_id, zone, forecast_date)`:

```sql
CREATE TABLE demand_forecasts (
 id uuid PRIMARY KEY,
 service_id uuid REFERENCES services(id),
 zone text,
 cooperative_id uuid REFERENCES cooperatives(id),
 forecast_date date,
 predicted_jobs int,
 confidence_low int,
 confidence_high int,
 model_version text, -- "lgbm-v1.2" or "rule-based"
 created_at timestamptz
);
```

**Cooperative scoping** (added in migration 0019): `cooperative_id` is backfilled from `worker_services → workers.cooperative_id`. Platform admins see all forecasts; cooperative admins see only forecasts for services their workers offer.

### 2.6 Rule-Based Fallback

When the Python service is unavailable, [src/lib/services/ml.ts:323](src/lib/services/ml.ts#L323) generates synthetic forecasts using:
- **Zone base demand** (hardcoded map: central=15, north=10, south=12, east=8, west=9)
- **Weekend boost** × 1.4 for Sat/Sun
- **Summer boost** × 1.2 for May–Aug
- **Random noise** ±15%
- **Confidence**: 0.5 (lower than ML's 0.8)

This fallback ensures the dashboard always has data even when offline.

### 2.7 Frontend Visualization

[src/features/forecasts/forecast-dashboard.tsx](src/features/forecasts/forecast-dashboard.tsx):
- 4 metric cards: total predicted demand, avg confidence, forecast count, zones covered
- Top zones by demand (sorted, top 8)
- Recent forecasts list (latest 10)
- "Generate Forecast" button (admin only, prompts for service_id + zone)

---

## 3. Worker Matching & Ranking

### 3.1 Purpose

When a customer searches for a service, return the **top-ranked workers** that match. Score is a weighted sum of 6 factors.

### 3.2 Scoring Formula

Defined in [src/lib/domain/matching.ts:19](src/lib/domain/matching.ts#L19) — `calculateWorkerScore(candidate)`:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Skill match** | 30 | Does the worker offer this service? (boolean) |
| **Distance** | 20 | `max(0, 20 - km)`. Closer = higher score. |
| **Availability** | 20 | Is the worker currently listed as available? |
| **Rating** | 15 | `(rating / 5) * 15`. Normalized to 0–5 stars. |
| **Experience** | 10 | `(min(years, 10) / 10) * 10`. Capped at 10 years. |
| **Service requirement** | 5 | Does the worker match the specific sub-requirement? |
| **Total** | 100 | Final score is a number 0–100 |

### 3.3 Distance Calculation

Haversine formula in [src/lib/services/distance.ts](src/lib/services/distance.ts):
- Uses Earth's radius (6371 km)
- Returns straight-line distance in km
- Used when customer provides GPS coordinates

### 3.4 Tie-Breaking

When scores are equal, sort by:
1. Higher average rating
2. Higher completed jobs count

### 3.5 ML-Blended Matching

The `/api/matching` endpoint does a two-pass blend:

1. **First pass (TS)**: Rank all matching workers using the rule-based formula
2. **Second pass (ML)**: Send top workers to `/api/allocation` → ML service returns refined scores
3. **Blend**: Override TS scores with ML scores where available, sort again
4. **Output**: Final ranked list with `mlBlended: true|false` flag

This means **the rule-based scores are always there as a safety net** — if the ML service fails, users still see ranked workers.

### 3.6 API Endpoint

**Endpoint**: `POST /api/matching`

**Input**:
```json
{
 "query": "electrical",
 "category": "uuid",
 "city": "Bangalore",
 "latitude": 12.97,
 "longitude": 77.59,
 "scheduledAt": "2026-09-16T14:00:00Z",
 "requirement": "AC repair"
}
```

**Output**:
```json
{
 "matches": [
 {
 "workerId": "uuid",
 "fullName": "Rajesh Kumar",
 "serviceName": "Electrical",
 "distanceKm": 2.4,
 "averageRating": 4.7,
 "yearsExperience": 8,
 "score": 87.5
 }
 ],
 "scoring": {
 "skill": 30,
  "distance": 20,
 "availability": 20,
 "rating": 15,
 "experience": 10,
 "serviceRequirement": 5
 },
 "mlBlended": true
}
```

### 3.7 Frontend

[src/features/discovery/worker-results.tsx](src/features/discovery/worker-results.tsx) renders ranked workers as cards with:
- Name, service, availability badge
- Distance, rating (stars), completed jobs
- Score shown as a colored badge
- Link to public worker profile

---

## 4. OR-Tools ILP Allocation

### 4.1 Purpose

When multiple jobs need to be assigned to multiple workers, solve an **Integer Linear Programming (ILP)** optimization problem. This is used in batch scenarios:
- Bulk booking assignment (e.g., "assign all pending bookings for zone X")
- Cooperative admin's "Auto-Allocate" button

### 4.2 Algorithm

- **Solver**: Google OR-Tools CP-SAT (Constraint Programming — Satisfiability)
- **Why ILP, not greedy?** Greedy can leave workers underutilized or assign distant workers. ILP finds the global optimum.
- **Objective**: Maximize total assignment score (sum of weighted scores)
- **Constraints**:
 1. Each worker assigned to at most `max_jobs_per_day` jobs (default 5)
 2. Each job assigned to at most 1 worker
 3. Worker must be `is_available = true`
 4. Worker must have `skill_match = true` for the job's service
 5. Worker's distance ≤ `max_distance_km` (default 10 km)
 6. Optional: prefer experienced workers (configurable)

### 4.3 Score Function (per assignment)

```
score = (skill_match ? 30 : 0)
 + max(0, 20 - distance_km)
 + (rating / 5) * 15
 + min(experience / 10, 1) * 10
 + trust_score * 5
```

### 4.4 API Endpoint

**Endpoint**: `POST /api/allocation`

**Input**:
```json
{
 "jobs": [
 {
 "id": "booking-uuid-1",
 "service_id": "service-uuid-1",
 "zone": "central",
 "location_lat": 12.97,
 "location_lng": 77.59,
 "scheduled_at": "2026-09-16T14:00:00Z",
 "priority": 1
 }
 ],
 "workers": [
 {
 "worker_id": "worker-uuid-1",
 "skills": ["electrical"],
 "is_available": true,
 "location_lat": 12.98,
 "location_lng": 77.60,
 "average_rating": 4.7,
 "years_experience": 8,
 "trust_score": 0.85,
 "skill_match": true,
 "max_jobs_per_day": 5
 }
 ]
}
```

**Output**:
```json
{
 "assignments": [
 {
 "jobId": "booking-uuid-1",
 "workerId": "worker-uuid-1",
 "score": 87.5,
 "distanceKm": 2.4
 }
 ],
 "unassignedJobs": ["booking-uuid-2"],
 "solverStatus": "OPTIMAL" | "FEASIBLE" | "greedy_fallback"
}
```

### 4.5 Fallback: Greedy Assignment

If the Python service is down, [src/lib/services/ml.ts:379](src/lib/services/ml.ts#L379) falls back to a **greedy algorithm**:
1. Score all workers using the same formula
2. Sort by score (descending)
3. For each job, assign the highest-scoring available worker who hasn't been assigned yet
4. Mark unassignable jobs as `unassignedJobs`

Result: `solverStatus: "greedy_fallback"` so you know it was a fallback.

### 4.6 Where It's Used

- `/admin/bookings` (future: "Auto-Allocate" button)
- Booking confirmation workflow (optional)
- Federation-level coordination (future)

---

## 5. Cancellation Risk Prediction

### 5.1 Purpose

Predict the **probability that a booking will be cancelled** before it completes. Used for:
- Showing risk warnings to customers at checkout
- Prioritizing high-risk bookings for cooperative admins
- Adjusting worker schedules dynamically

### 5.2 Algorithm

**Factor-based scoring** (deterministic, explainable) — defined in [src/lib/domain/cancellation-prediction.ts](src/lib/domain/cancellation-prediction.ts).

Each factor contributes a weight. Total weights sum to 1.0. Final score is `clamp(sum_of_weights, 0, 1)`.

### 5.3 Factors & Weights

| Factor ID | Weight | Description |
|-----------|--------|-------------|
| `no_worker_24h` | 0.30 | Booking unassigned for 24+ hours |
| `high_complaint_area` | 0.20 | Customer's area has >10% complaint rate |
| `price_mismatch` | 0.15 | Quoted price significantly above market |
| `worker_low_rating` | 0.15 | Assigned worker rating < 3.0 |
| `peak_demand_shortage` | 0.10 | Booking during peak with insufficient workers |
| `past_cancellations` | 0.10 | Customer cancelled 2+ times in last 30 days |

### 5.4 Risk Levels

```
score >= 0.70 → critical
score >= 0.50 → high
score >= 0.30 → medium
score < 0.30 → low
```

### 5.5 API Endpoint

**Endpoint**: `POST /api/predictions/cancellation` (assumed path)

**Input**:
```json
{
  "bookingId": "uuid",
 "factors": ["no_worker_24h", "price_mismatch"]
}
```

**Output**:
```json
{
 "bookingId": "uuid",
 "score": 0.45,
 "level": "medium",
 "factors": [
 { "id": "no_worker_24h", "name": "No worker assigned within 24 hours", "weight": 0.30 },
 { "id": "price_mismatch", "name": "Price mismatch", "weight": 0.15 }
 ]
}
```

### 5.6 Why Deterministic?

Each factor has a **known weight and description**. The platform can show customers *why* their booking is risky. This is far more transparent than an ML black box for a trust-sensitive feature.

### 5.7 Frontend

- Booking confirmation page: shows risk badge if score ≥ 0.3
- Cooperative admin: `/admin/predictions` dashboard shows high-risk bookings
- Worker: sees "Customer history of cancellations" in their booking card

---

## 6. Fraud Detection

### 6.1 Purpose

Detect suspicious behavior across customers and workers. Used for:
- Manual review queue (admin)
- Auto-flag high-severity signals
- Trust score adjustments

### 6.2 Signal Types

Defined in [src/lib/domain/fraud-detection.ts](src/lib/domain/fraud-detection.ts) — `FRAUD_RULES`:

| Signal ID | Severity | Description |
|-----------|----------|-------------|
| `duplicate_booking` | medium | Same customer, multiple bookings within 1 hour |
| `fake_payment` | critical | Payment verification failed or amount mismatch |
| `worker_bot_behavior` | high | Worker accepting jobs at unnatural speed/pattern |
| `customer_fake_bookings` | high | Customer repeatedly booking and cancelling |
| `suspicious_ip` | low | Multiple accounts from same IP |

### 6.3 Detection Logic

Currently **rule-based, manually triggered**. The detection engine:
1. Reads recent bookings + payment events
2. Applies rule heuristics
3. Returns array of triggered signal IDs

**Future ML upgrade**: Anomaly detection using Isolation Forest or autoencoder on historical behavior.

### 6.4 API Endpoint

**Endpoint**: `POST /api/fraud/analyze`

**Input**:
```json
{
 "userId": "uuid",
 "window": "30d"
}
```

**Output**:
```json
{
 "userId": "uuid",
 "signals": [
 { "type": "duplicate_booking", "severity": "medium", "description": "..." },
 { "type": "fake_payment", "severity": "critical", "description": "..." }
 ],
 "riskScore": 0.65
}
```

### 6.5 Trust Score Integration

Triggered fraud signals feed into the worker's trust score:
- `worker_bot_behavior` → penalty: -5 points
- `fake_payment` → penalty: -15 points
- `customer_fake_bookings` → no penalty on worker, but customer flagged

---

## 7. Skill Gap Analysis

### 7.1 Purpose

Identify **services with too much demand and too few workers**. Used for:
- Worker recruitment recommendations
- Cooperative expansion planning
- "Trending demand" UI on admin dashboard

### 7.2 Algorithm

Defined in [src/lib/services/skill-gap.ts](src/lib/services/skill-gap.ts):

```
gap = max(0, demand - supply)
severity:
 gap >= 20 → critical
 gap >= 5 → moderate
 else → low
```

Where:
- **demand** = number of bookings for the service in the last 30 days
- **supply** = number of workers offering the service (via `worker_services`)

### 7.3 API Endpoint

**Endpoint**: `GET /api/admin/skill-gap` (assumed)

**Output**:
```json
[
 {
 "serviceId": "uuid",
 "serviceName": "Electrical",
 "demandBookings": 142,
 "activeWorkers": 8,
 "gap": 134,
 "severity": "critical"
 }
]
```

Sorted by gap descending (most critical first).

### 7.4 Frontend

`/admin/skill-gap` page shows a table:
- Service name
- Demand (bookings)
- Active workers
- Gap (highlighted in red if critical)
- Severity badge
- Sorted descending

### 7.5 Cooperative Scoping

Cooperative admins see only their services (filtered through `worker_services` for workers in their cooperative). Platform admins see all services.

---

## 8. Trust Score

### 8.1 Purpose

A **composite reliability metric** (0.00–5.00) shown on every worker profile. Used for:
- Worker search ranking (high trust = higher rank)
- Cooperative admin monitoring
- Customer decision-making

### 8.2 Formula

Defined in [src/lib/domain/trust-score.ts](src/lib/domain/trust-score.ts) — `calculateTrustScore(input)`:

```
completionScore = (jobsCompleted / jobsAccepted) * 40 (max 40)
qualityScore = (avgRating / 5) * 25 (max 25)
reliabilityScore = 20 - min(complaints*2 + disputes*5, 20) (max 20)
welfareScore = (approved / total) * 10, or 10 if no claims (max 10)
recencyScore = 5 if last job <30d, 2.5 if <60d, else 0 (max 5)

raw = sum of above (max 100)
trustScore = round(raw / 20, 2) → range 0.00–5.00
```

### 8.3 Inputs

| Input | Source |
|-------|--------|
| `jobsCompleted` | `bookings.status = 'completed'` count |
| `jobsAccepted` | `bookings.status IN ('accepted','confirmed',...)` count |
| `avgRating` | `reviews.rating` average |
| `complaintsCount` | `complaints` where subject = worker |
| `disputeCount` | `bookings.status = 'disputed'` |
| `welfareClaimsApproved` | `welfare_claims.status = 'approved'` |
| `welfareClaimsRejected` | `welfare_claims.status = 'rejected'` |
| `daysSinceLastJob` | `now() - max(bookings.completed_at)` |

### 8.4 Storage

- Stored on `workers.trust_score` (numeric)
- Recomputed by a Supabase trigger after every booking status change, review, or welfare claim update
- Cached on the worker row for fast queries

### 8.5 Display

- Worker profile page: star rating with "Trust: 4.7/5"
- Search results: small trust badge
- Admin dashboard: sorted by trust score for verification

---

## 9. Availability Scheduling

### 9.1 Purpose

Workers can set weekly availability (Mon–Sun, time ranges). Used for:
- Search filtering (only show workers available now)
- Auto-rejection of bookings during off-hours
- Capacity forecasting

### 9.2 Schema

Defined in [src/lib/domain/availability.ts](src/lib/domain/availability.ts):

```typescript
type DaySchedule = {
 dayOfWeek: number; // 0=Sunday, 6=Saturday
 startTime: string; // "HH:mm"
 endTime: string; // "HH:mm"
 isActive: boolean;
};

type AvailabilitySettings = {
 workerId: string;
 days: DaySchedule[]; // 1–7 entries
};
```

### 9.3 Validation (Zod)

```typescript
availabilitySettingsSchema = z.object({
 workerId: z.string().uuid(),
 days: z.array(dayScheduleSchema).min(1).max(7),
});
```

### 9.4 Storage

- Worker submits form → `POST /api/worker/availability`
- Stored atomically via `worker_settings` RPC
- Triggers `workers.is_available` boolean update

### 9.5 Search Integration

[src/features/discovery/data.ts](src/features/discovery/data.ts) `discoverWorkers`:
- If `is_available = true`, worker appears in results
- If customer specifies `scheduledAt`, validates against worker's schedule

---

## 10. Alerts Engine

### 10.1 Purpose

Monitor platform metrics and surface issues to admins. Rule-based alert system.

### 10.2 Rule Types

Defined in [src/lib/domain/alerts.ts](src/lib/domain/alerts.ts):

| Metric | Description | Default Threshold |
|--------|-------------|-------------------|
| `complaint_rate` | Complaints per 100 bookings | >5 |
| `cancellation_rate` | Cancellations per 100 bookings | >10 |
| `worker_shortage` | Workers available / demand ratio | <0.5 |
| `payment_failure` | Failed payments per 100 attempts | >2 |
| `welfare_drain` | Welfare claims paid / fund balance | >0.8 |

### 10.3 Severity

- **warning**: threshold exceeded but not urgent
- **critical**: threshold exceeded and urgent (admin notification)

### 10.4 Window

Each rule has a `windowHours` — the time period to evaluate (e.g., last 24h, last 7d).

### 10.5 API Endpoint

**Endpoint**: `GET /api/admin/alerts`

**Output**:
```json
[
 {
 "id": "complaint_rate_spike",
 "name": "Complaint rate spike",
 "metric": "complaint_rate",
 "threshold": 5,
 "currentValue": 7.2,
 "severity": "critical",
 "triggered": true,
 "windowHours": 24
 }
]
```

### 10.6 Frontend

`/admin/alerts` page:
- List of triggered alerts
- "Acknowledge" button (admin marks as seen)
- Historical chart (last 30 days)

---

## 11. API Surface

### 11.1 ML Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/matching` | POST | Public | Rank workers for a search |
| `/api/allocation` | POST | Admin | ILP batch allocation |
| `/api/forecast/demand` | GET/POST | Admin | List / generate forecasts |
| `/api/forecast/cron` | POST | Cron secret | Bulk regenerate forecasts |
| `/api/forecast/trigger` | POST | User | Refresh forecast on booking |
| `/api/predictions/cancellation` | POST | User/Admin | Cancellation risk for a booking |
| `/api/fraud/analyze` | POST | Admin | Run fraud detection on user |
| `/api/admin/skill-gap` | GET | Admin | Skill gap analysis |
| `/api/admin/alerts` | GET | Admin | List triggered alerts |

### 11.2 Auth Matrix

| Endpoint | Public | Customer | Worker | Coop Admin | Platform Admin |
|----------|--------|----------|--------|------------|----------------|
| `/api/matching` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/allocation` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/api/forecast/*` | ❌ | ❌ | ❌ | ✅ (scoped) | ✅ (global) |
| `/api/predictions/cancellation` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `/api/fraud/analyze` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `/api/admin/skill-gap` | ❌ | ❌ | ❌ | ✅ (scoped) | ✅ (global) |
| `/api/admin/alerts` | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 12. Cron & Automation

### 12.1 Forecast Regeneration

**Endpoint**: `POST /api/forecast/cron`
**Auth**: `Authorization: Bearer ${CRON_SECRET}`
**Schedule**: Vercel cron, every 5 minutes (`*/5 * * * *`)

**Logic**:
1. Find all `(service_id, zone)` pairs from bookings in last 90 days
2. Find all service categories with active bookings
3. Skip pairs that already have forecasts from the last 12 hours
4. Generate fresh forecasts for stale pairs
5. Return counts: `generated`, `skipped`, `errors`

### 12.2 Booking-Triggered Forecast

**Endpoint**: `POST /api/forecast/trigger`
**Auth**: User session
**Called by**: Booking confirmation flow

**Logic**:
1. Booking confirmed → resolve `service_id` + zone
2. Generate forecast for that pair (best-effort)
3. Don't fail the booking if forecast fails

### 12.3 Vercel Configuration

```json
// vercel.json
{
 "crons": [
 {
 "path": "/api/forecast/cron",
 "schedule": "*/5 * * * *"
  }
 ]
}
```

### 12.4 Trust Score Refresh

Triggered automatically by Supabase trigger on:
- Booking status change
- New review
- Welfare claim status change

---

## 13. Database Schema

### 13.1 ML Tables

```sql
demand_forecasts (
 id uuid PK,
 service_id uuid FK → services(id),
 zone text,
 cooperative_id uuid FK → cooperatives(id),
 forecast_date date,
 predicted_jobs int,
 confidence_low int,
 confidence_high int,
 model_version text,
 created_at timestamptz
);

-- Unique constraint for upsert
UNIQUE (service_id, zone, forecast_date);
```

### 13.2 Supporting Tables

| Table | ML Relevance |
|-------|--------------|
| `bookings` | Source of demand signal, training data for forecast |
| `workers` | `trust_score`, `rating`, `completed_jobs` for matching |
| `worker_services` | Skill match for matching + skill gap |
| `reviews` | Rating source for trust score + matching |
| `complaints` | Fraud signals + reliability scoring |
| `welfare_claims` | Welfare integrity scoring |
| `cooperatives` | Forecast scoping |

### 13.3 Indexes

```sql
CREATE INDEX idx_demand_forecasts_coop_service
 ON demand_forecasts(service_id, cooperative_id, forecast_date DESC);

CREATE INDEX idx_bookings_status_created
 ON bookings(status, created_at DESC);
```

---

## 14. Performance Metrics

### 14.1 Reported (per PRD)

| Metric | Value |
|--------|-------|
| Demand forecast MAPE | **12.75%** |
| Demand forecast R² | **0.734** |
| Worker match latency | <100ms (TS only), <500ms (with ML blend) |
| Allocation latency | <2s (typical), <5s (timeout) |
| Fallback reliability | 100% (always works) |

### 14.2 Tracked Metrics

- Forecast accuracy over time (weekly MAPE)
- Cancellation prediction precision/recall (monthly)
- Fraud signal precision (manual review feedback)
- Skill gap detection accuracy (admin verification)

### 14.3 Cost

- HuggingFace Space: free tier (CPU)
- Vercel cron: included in plan
- Supabase: row counts + queries (negligible)

---

## 15. Demo Script for the Panel

### 15.1 Opening (1 minute)

> "CooperativeConnect uses a hybrid ML architecture: a Python ML service for heavy inference (LightGBM for forecasting, OR-Tools for allocation) with deterministic TypeScript fallbacks for every model. The app never breaks if the ML service is down."

### 15.2 Worker Matching (3 minutes)

1. Open `/services`, search "electrical" in Bangalore
2. Show the ranked worker list with scores
3. Hover over a worker → explain the 6-factor scoring:
 - Skill match (30 pts)
 - Distance (20 pts)
 - Availability (20 pts)
 - Rating (15 pts)
 - Experience (10 pts)
 - Service requirement (5 pts)
4. Open DevTools → Network tab → show `/api/matching` response with `mlBlended: true`

### 15.3 Demand Forecast (3 minutes)

1. Open `/forecasts` (as platform admin)
2. Show the 4 metric cards
3. Show top zones by demand
4. Click "Generate Forecast" → enter a service + zone
5. Watch the ML call → response time → result upserted to DB
6. Show the model_version column in DB to prove LightGBM was used

### 15.4 ILP Allocation (2 minutes)

1. Mention the `/api/allocation` endpoint
2. Show the OR-Tools solver constraints:
 - Each worker ≤ N jobs/day
 - Each job → 1 worker
 - Distance ≤ 10km
 - Skill match required
3. Mention the greedy fallback if OR-Tools is down

### 15.5 Cancellation Risk (2 minutes)

1. Open a booking → show the risk badge
2. Explain the 6 weighted factors
3. Show how each factor contributes to the score
4. Highlight that **deterministic = explainable**

### 15.6 Fraud Detection (2 minutes)

1. Open `/admin/alerts` → show triggered signals
2. Explain the 5 fraud rule types
3. Mention future ML upgrade (Isolation Forest)

### 15.7 Skill Gap (1 minute)

1. Open `/admin/skill-gap`
2. Show the sorted list of services with demand vs supply
3. Highlight "critical" severity badges
4. Mention this drives worker recruitment

### 15.8 Trust Score (2 minutes)

1. Open a worker profile → show trust score (e.g., 4.7/5)
2. Explain the formula: completion, quality, reliability, welfare, recency
3. Show the DB row where it's cached

### 15.9 Closing (1 minute)

> "Every ML output is explainable. Every ML call has a fallback. Every forecast is scoped to the cooperative. The system is production-ready, fault-tolerant, and fair."

---

## Appendix: ML Feature Inventory Table

| Feature | Type | File | Inputs | Outputs | Fallback |
|---------|------|------|--------|---------|----------|
| Demand Forecast | ML (LightGBM) | `lib/services/ml.ts` | service_id, zone, days | predicted_jobs[7], confidence | Rule-based (weekend + summer boost) |
| Worker Match | Rule-based + ML blend | `lib/domain/matching.ts` | search params | ranked workers | Always works (TS) |
| ILP Allocation | ML (OR-Tools) | `lib/services/ml.ts` | jobs[], workers[] | assignments[] | Greedy assignment |
| Cancellation Risk | Deterministic | `lib/domain/cancellation-prediction.ts` | factor list | 0–1 score | N/A |
| Fraud Signals | Rule-based | `lib/domain/fraud-detection.ts` | user activity | signal list | N/A |
| Skill Gap | Rule-based | `lib/services/skill-gap.ts` | bookings, workers | gap per service | N/A |
| Trust Score | Deterministic formula | `lib/domain/trust-score.ts` | worker metrics | 0–5 score | N/A |
| Availability | Zod schema | `lib/domain/availability.ts` | weekly schedule | validated settings | N/A |
| Alerts | Rule-based | `lib/domain/alerts.ts` | platform metrics | triggered alerts | N/A |

---

## Appendix: Common Panel Questions & Answers

**Q: Why hybrid (Python + TS) instead of all-Python?**
A: TypeScript fallbacks mean the app works even when the ML service is down, scaling issues, or rate-limited. Critical for a service platform that can't have downtime.

**Q: Why LightGBM over a neural network for forecasting?**
A: LightGBM is interpretable, fast, and works well with tabular data. NN would be overkill for the dataset size and reduce explainability.

**Q: Why OR-Tools for allocation?**
A: It finds the global optimum (greedy can't), handles complex constraints, and is the industry standard for scheduling/assignment problems.

**Q: How do you prevent ML bias?**
A: All weights are explicit and tunable. Cooperative admins can adjust thresholds. Trust scores are explainable. Forecasts don't use protected attributes (gender, caste, etc.).

**Q: What's the latency budget?**
A: 5-second ML timeout. Rule-based fallback adds 0ms. UI always renders within 500ms.

**Q: How do you handle new cooperatives with no data?**
A: Rule-based forecasts use zone-base demand as a default. Trust score uses a default of 5/5 for new workers (with low confidence). Matching weights all factors equally initially.

**Q: Can the platform work without the Python ML service?**
A: Yes — every ML call has a deterministic fallback. The UI shows `modelVersion: "rule-based"` so admins know.

**Q: How do you measure model performance?**
A: Weekly MAPE on demand forecasts (target <15%). Monthly precision/recall on cancellation prediction. Manual review feedback on fraud signals.

**Q: What's the next ML feature?**
A: Anomaly detection for fraud (Isolation Forest), worker recommendation system (collaborative filtering), and price optimization (bandit algorithm).

---

**Last Updated**: September 16, 2026
**Version**: 1.0
**Audience**: Internal team + panel review

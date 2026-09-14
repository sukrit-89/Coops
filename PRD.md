# Product Requirements Document — Kaarya (Free-Tier Edition)
### Cooperative Workforce Intelligence Platform

**Version:** 2.0 (Free-Tier Architecture)
**Status:** Production Requirements
**Last Updated:** September 2026
**Constraint:** ₹0/month infrastructure cost until product-market fit proven

---

## Critical Free-Tier Constraint Statement

**Every component in this PRD must run on free-tier services until the platform reaches 5,000+ monthly bookings.** Below that threshold, the platform is unproven; spending on infrastructure is premature.

This is not a hackathon shortcut. This is a deliberate cost discipline decision:
- Free tiers give us 6–18 months of runway without external funding
- Once PMF is proven, revenue funds paid tiers
- Forces lean architecture from Day 1 (no microservices, no managed ML platforms)

---

## Free-Tier Service Stack (Verified Limits)

| Service | Free Tier Limit | Our Max Need (Day 1) | Adequate? |
|---|---|---|---|
| **Supabase (PostgreSQL + PostGIS + Auth + Storage)** | 500MB DB, 1GB storage, 50K MAU, 5GB bandwidth | 50MB DB, 500MB storage, 100 MAU | **Yes (huge headroom)** |
| **Vercel (Frontend hosting)** | 100GB bandwidth, unlimited static sites | 20GB bandwidth | **Yes** |
| **Render (Backend hosting)** | 750h/month free tier (web service) | 720h/month | **Tight but doable** |
| **Railway (Backend alternative)** | $5 free credit/month (~500h) | 720h/month | **Yes (more reliable than Render)** |
| **GitHub Actions (CI/CD)** | 2,000 min/month | 200 min/month | **Yes** |
| **Cloudflare (CDN + DNS)** | Unlimited bandwidth, unlimited DNS | Unlimited | **Yes** |
| **Resend (Email)** | 100 emails/day, 3,000/month | 50/day | **Yes** |
| **MSG91 (SMS — India)** | Pay-as-you-go, ~₹0.20/SMS | 500 SMS/month = ₹100 | **Yes (cheap)** |
| **Razorpay (Payments)** | No monthly fee, 2% per transaction | Pay per transaction | **Yes** |
| **Google Maps (Distance Matrix)** | $200/month free credit = ~40K requests | 5K requests/month | **Yes** |
| **OpenWeatherMap (Weather API)** | 1M calls/month free | 30 calls/day = 1K/month | **Yes** |
| **GitHub (Code repo)** | Unlimited public repos | 1 repo | **Yes** |
| **HuggingFace Spaces (ML demo hosting)** | Free CPU tier | ML inference API | **Yes (Phase 2)** |

**Total monthly cost at Day 1: ₹0** (excluding MSG91 SMS at ~₹100/month and Razorpay 2% transaction fee).

---

## Revised Money Flow (Free-Tier Aware)

```
Customer pays ₹1,000
 → Razorpay (2% = ₹20) — paid per transaction, not monthly fee
 → Platform escrow (free — held in our bank account, not platform-managed)
 → Settlement T+2:
 ├── Worker: ₹700 (70%) — NEFT/UPI from our bank account
 ├── Cooperative: ₹150 (15%)
 ├── Federation: ₹50 (5%)
 ├── Welfare Reserve: ₹30 (3%)
 └── Platform net: ₹50 (5%)
 
Platform operational costs: ~₹0–500/month (SMS only)
Break-even: 10 bookings/month (literally)
```

**We don't pay for infrastructure until we have revenue.** This is the discipline.

---

## Production Architecture — Free-Tier Implementation

### High-Level Stack

```
┌──────────────────────────────────────────────────────────────┐
│ CLIENT │
│ Flutter Mobile (iOS + Android) │
│ React Web (Customer + Admin) │
└──────────────────┬───────────────────────────────────────────┘
 │ HTTPS (Cloudflare free)
 ▼
┌──────────────────────────────────────────────────────────────┐
│ EDGE │
│ Cloudflare CDN + DNS (free) │
└──────────────────┬───────────────────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND │
│ Railway.app (Node.js/Express) — 500h/month free │
│ OR Render.com — 750h/month free │
│ Monolithic API │
└────┬───────────────────────────────────────────────────────┬─┘
 │ │
 ▼ ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ DATABASE + AUTH + STORAGE │ │ ML PIPELINE │
│ Supabase (free tier) │ │ HuggingFace Spaces │
│ - PostgreSQL + PostGIS │ │ (CPU free tier) │
│ - Row Level Security (RLS) │ │ OR local Python script │
│ - Auth (phone OTP via Supabase) │ │ run on Railway │
│ - Storage (photos, invoices) │ │ │
└──────────────────────────────┘ └──────────────────────────────┘
 │
 ▼
┌──────────────────────────────────────────────────────────────┐
│ EXTERNAL (Pay-per-use only) │
│ - Razorpay (2% per transaction) │
│ - MSG91 (₹0.20/SMS, only when SMS sent) │
│ - Google Maps (free $200/month credit) │
│ - OpenWeatherMap (free 1M calls/month) │
└──────────────────────────────────────────────────────────────┘
```

### Why Supabase Replaces 5+ Services

Supabase gives us **for free**:
- **PostgreSQL database** (500MB, plenty for 50K+ records)
- **PostGIS extension** (geospatial queries)
- **Authentication** (phone OTP built-in via Twilio integration)
- **Row Level Security** (RLS for multi-tenant data isolation)
- **Storage** (1GB for photos and invoices)
- **Realtime subscriptions** (for live job tracking)
- **Edge Functions** (Deno-based, for lightweight serverless logic)

This collapses our backend stack. We don't need separate DB hosting, auth service, or file storage.

### Why Railway Beats Render for Backend

| Feature | Railway | Render |
|---|---|---|
| Free tier hours | $5/month credit (~500h) | 750h/month |
| Sleep on free tier | No (always on) | Yes (spins down after 15min idle) |
| Cold start | None | 30+ seconds |
| Cron jobs | Yes (free) | Yes (free) |
| PostgreSQL included | No (use Supabase) | No (use Supabase) |
| Ease of use | Excellent | Excellent |

**Railway chosen** because no cold starts = consistent ML inference + real-time matching.

**Workaround for Render sleep:** Use a free cron service (cron-job.org) to ping every 14 minutes. Acceptable but Railway is cleaner.

### Backend Architecture (Monolithic, Single Railway Service)

```
kaarya-backend/
 ├── src/
 │ ├── modules/
 │ │ ├── identity/ # Supabase Auth integration
 │ │ ├── worker/ # Worker profiles
 │ │ ├── customer/ # Customer profiles
 │ │ ├── cooperative/ # Cooperative management
 │ │ ├── federation/ # Federation ops
 │ │ ├── service-catalog/
 │ │ ├── booking/ # Booking lifecycle
 │ │ ├── matching/ # Allocation algorithm
 │ │ ├── payment/ # Razorpay integration
 │ │ ├── settlement/ # Payout splits
 │ │ ├── reputation/ # Ratings + trust scores
 │ │ ├── notification/ # SMS + push
 │ │ ├── welfare/ # Welfare contributions
 │ │ ├── forecast/ # Demand forecasting
 │ │ └── analytics/
 │ ├── ml/ # ML model inference (calls HF API or local)
 │ ├── lib/
 │ │ ├── supabase.ts # DB client
 │ │ ├── razorpay.ts
 │ │ ├── msg91.ts
 │ │ ├── maps.ts # Google Distance Matrix
 │ │ └── weather.ts # OpenWeatherMap
 │ └── index.ts # Express app
 ├── ml/
 │ ├── train.py # Training script (run locally or HF)
 │ ├── forecast.py # Inference (called by API)
 │ ├── allocation.py # ILP solver
 │ └── models/ # Serialized models (committed to repo)
 ├── package.json
 └── README.md
```

**Single deployable unit.** Scales vertically (Railway plan upgrade) until ~5K bookings/day.

---

## Database Schema (Supabase PostgreSQL + PostGIS)

### Migration Strategy

All schema lives in `/supabase/migrations/*.sql`. Applied via Supabase CLI or dashboard. Version-controlled in repo.

### Core Tables

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users (managed by Supabase Auth, extended with our fields)
CREATE TABLE user_profile (
 id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 phone TEXT UNIQUE NOT NULL,
 name TEXT NOT NULL,
 role TEXT NOT NULL CHECK (role IN ('worker', 'customer', 'coop_admin', 'fed_admin', 'super_admin')),
 language TEXT DEFAULT 'en',
 created_at TIMESTAMPTZ DEFAULT now(),
 last_active TIMESTAMPTZ,
 metadata JSONB DEFAULT '{}'::jsonb
);

-- Worker profile
CREATE TABLE worker (
 id UUID PRIMARY KEY REFERENCES user_profile(id),
 cooperative_id UUID REFERENCES cooperative(id),
 primary_skill TEXT NOT NULL,
 certified_skills TEXT[] DEFAULT '{}',
 rating NUMERIC(3,2) DEFAULT 0.00 CHECK (rating BETWEEN 0 AND 5),
 jobs_completed INT DEFAULT 0,
 jobs_accepted INT DEFAULT 0,
 trust_score NUMERIC(3,2) DEFAULT 0.50,
 service_radius_meters INT DEFAULT 5000,
 base_location GEOGRAPHY(POINT, 4326),
 is_active BOOLEAN DEFAULT true,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_worker_location ON worker USING GIST (base_location);
CREATE INDEX idx_worker_cooperative ON worker(cooperative_id);
CREATE INDEX idx_worker_skills ON worker USING GIN (certified_skills);

-- Cooperative
CREATE TABLE cooperative (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 federation_id UUID REFERENCES federation(id),
 name TEXT NOT NULL,
 district TEXT NOT NULL,
 zone TEXT,
 bank_account JSONB, -- {account_no, ifsc, name}
 admin_id UUID REFERENCES user_profile(id),
 gstin TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),
 is_active BOOLEAN DEFAULT true
);

-- Federation
CREATE TABLE federation (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name TEXT NOT NULL,
 region TEXT NOT NULL,
 admin_id UUID REFERENCES user_profile(id),
 created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer
CREATE TABLE customer (
 id UUID PRIMARY KEY REFERENCES user_profile(id),
 type TEXT NOT NULL CHECK (type IN ('household', 'institution')),
 organization_name TEXT,
 gstin TEXT,
 default_address TEXT,
 default_location GEOGRAPHY(POINT, 4326),
 created_at TIMESTAMPTZ DEFAULT now()
);

-- Service catalog
CREATE TABLE service (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name TEXT NOT NULL,
 category TEXT NOT NULL,
 base_price NUMERIC(10,2) NOT NULL,
 duration_minutes INT DEFAULT 60,
 description TEXT,
 is_active BOOLEAN DEFAULT true
);

-- Booking
CREATE TABLE booking (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 customer_id UUID REFERENCES customer(id),
 worker_id UUID REFERENCES worker(id),
 cooperative_id UUID REFERENCES cooperative(id),
 service_id UUID REFERENCES service(id),
 scheduled_at TIMESTAMPTZ NOT NULL,
 completed_at TIMESTAMPTZ,
 cancelled_at TIMESTAMPTZ,
 status TEXT NOT NULL DEFAULT 'pending'
 CHECK (status IN ('pending','matching','assigned','accepted','arrived',
 'completed','paid','cancelled','disputed','no_show')),
 location GEOGRAPHY(POINT, 4326),
 address_text TEXT,
 pin_code TEXT,
 price NUMERIC(10,2) NOT NULL,
 final_price NUMERIC(10,2),
 cancellation_reason TEXT,
 dispute_flag BOOLEAN DEFAULT false,
 dispute_resolution TEXT,
 created_at TIMESTAMPTZ DEFAULT now(),
 updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_booking_status ON booking(status);
CREATE INDEX idx_booking_scheduled ON booking(scheduled_at);
CREATE INDEX idx_booking_customer ON booking(customer_id);
CREATE INDEX idx_booking_worker ON booking(worker_id);
CREATE INDEX idx_booking_location ON booking USING GIST (location);

-- Booking events (audit trail)
CREATE TABLE booking_event (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id UUID REFERENCES booking(id) ON DELETE CASCADE,
 event_type TEXT NOT NULL,
 actor_type TEXT NOT NULL,
 actor_id UUID,
 location GEOGRAPHY(POINT, 4326),
 notes TEXT,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_event_booking ON booking_event(booking_id);

-- Payment
CREATE TABLE payment (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id UUID REFERENCES booking(id),
 amount NUMERIC(10,2) NOT NULL,
 gateway_fee NUMERIC(10,2) DEFAULT 0,
 net_amount NUMERIC(10,2) NOT NULL,
 gateway TEXT DEFAULT 'razorpay',
 gateway_ref TEXT,
 status TEXT NOT NULL CHECK (status IN ('pending','success','failed','refunded')),
 paid_at TIMESTAMPTZ,
 refunded_at TIMESTAMPTZ,
 refund_amount NUMERIC(10,2),
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_payment_booking ON payment(booking_id);

-- Settlement (one per period per worker/coop)
CREATE TABLE settlement (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 period_start DATE NOT NULL,
 period_end DATE NOT NULL,
 recipient_type TEXT NOT NULL CHECK (recipient_type IN ('worker','cooperative','federation','welfare')),
 recipient_id UUID NOT NULL,
 amount NUMERIC(10,2) NOT NULL,
 payout_status TEXT DEFAULT 'pending',
 payout_ref TEXT,
 paid_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_settlement_recipient ON settlement(recipient_id, recipient_type);

-- Rating
CREATE TABLE rating (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id UUID REFERENCES booking(id),
 rater_id UUID REFERENCES user_profile(id),
 worker_id UUID REFERENCES worker(id),
 score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
 comment TEXT,
 is_verified BOOLEAN DEFAULT false,
 created_at TIMESTAMPTZ DEFAULT now()
);

-- Welfare account
CREATE TABLE welfare_account (
 worker_id UUID PRIMARY KEY REFERENCES worker(id),
 balance NUMERIC(10,2) DEFAULT 0,
 total_contributions NUMERIC(10,2) DEFAULT 0,
 total_claims NUMERIC(10,2) DEFAULT 0,
 last_updated TIMESTAMPTZ DEFAULT now()
);

-- Welfare claims
CREATE TABLE welfare_claim (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 worker_id UUID REFERENCES worker(id),
 amount NUMERIC(10,2) NOT NULL,
 reason TEXT NOT NULL,
 status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
 approved_by UUID REFERENCES user_profile(id),
 paid_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ DEFAULT now()
);

-- Demand forecast
CREATE TABLE demand_forecast (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 service_id UUID REFERENCES service(id),
 zone TEXT NOT NULL,
 forecast_date DATE NOT NULL,
 predicted_jobs NUMERIC(10,2) NOT NULL,
 confidence_low NUMERIC(10,2),
 confidence_high NUMERIC(10,2),
 model_version TEXT,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_forecast_lookup ON demand_forecast(service_id, zone, forecast_date);

-- Worker availability
CREATE TABLE worker_availability (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 worker_id UUID REFERENCES worker(id),
 day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
 start_time TIME NOT NULL,
 end_time TIME NOT NULL,
 is_active BOOLEAN DEFAULT true
);

-- AMC contracts (institutional)
CREATE TABLE amc_contract (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 institution_id UUID REFERENCES customer(id),
 cooperative_id UUID REFERENCES cooperative(id),
 start_date DATE NOT NULL,
 end_date DATE NOT NULL,
 total_visits_per_month INT NOT NULL,
 service_ids TEXT[] NOT NULL,
 sla_response_hours INT DEFAULT 24,
 status TEXT DEFAULT 'active',
 created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log (minimal, append-only)
CREATE TABLE audit_log (
 id BIGSERIAL PRIMARY KEY,
 actor_id UUID,
 action TEXT NOT NULL,
 resource_type TEXT,
 resource_id UUID,
 metadata JSONB,
 ip_address INET,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- Row Level Security (RLS) — critical for multi-tenant security
ALTER TABLE worker ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (add per table)
-- Workers can only view/update own profile
CREATE POLICY worker_own_profile ON worker
 FOR ALL USING (auth.uid() = id);

-- Cooperative admins can view workers in their cooperative
CREATE POLICY coop_admin_view_workers ON worker
 FOR SELECT USING (
 cooperative_id IN (
 SELECT id FROM cooperative WHERE admin_id = auth.uid()
 )
 );

-- Customers can view own bookings
CREATE POLICY customer_view_own_bookings ON booking
 FOR SELECT USING (customer_id = auth.uid());

-- Service role bypasses RLS (used by backend)
-- Backend uses service_role key, never exposed to client
```

### Storage Buckets (Supabase Storage, free tier)

```
photos/
 ├── worker_profiles/ (worker profile photos)
 ├── job_completion/ (completion photos per booking)
 ├── disputes/ (dispute evidence)
 └── certifications/ (worker cert uploads)

invoices/
 └── {year}/{month}/{cooperative_id}/ (PDF invoices)

exports/
 └── {federation_id}/ (analytics exports for federation admins)
```

**Free tier limit: 1GB.** Sufficient for ~10K booking photos + 5K invoices. Upgrade path: $25/month for 100GB when needed.

---

## ML Architecture (Free-Tier Implementation)

### Where ML Runs

**Option A (chosen): HuggingFace Spaces (free CPU tier)**
- Host ML inference API as a Gradio or FastAPI Space
- Free CPU: 2 vCPU, 16GB RAM, always-on for public Spaces
- Backend calls HF API for predictions
- Models trained locally, pushed to HF Space

**Option B: Local Python script triggered via Railway cron**
- Simpler but blocks the main app during inference
- Limited by Railway's 500h/month

**Decision: Option A** for clean separation and scalability.

### ML Model Hosting

```python
# HF Space: kaarya-ml-inference
# File: app.py (FastAPI)
from fastapi import FastAPI
import joblib
import pandas as pd
import lightgbm as lgb
from ortools.sat.python import cp_model

app = FastAPI()

# Load models at startup
demand_model = joblib.load('models/demand_forecast_v1.pkl')
allocation_weights = joblib.load('models/allocation_weights_v1.pkl')

@app.post("/forecast/demand")
def forecast_demand(service_id: str, zone: str, days: int = 7):
 """Predict demand for next N days."""
 features = build_features(service_id, zone, days)
 predictions = demand_model.predict(features)
 return {"predictions": predictions.tolist()}

@app.post("/allocate")
def allocate_workers(jobs: list, workers: list):
 """Solve worker-to-job assignment."""
 # ILP via OR-Tools
 solver = cp_model.CpSolver()
 model = cp_model.CpModel()
 # ... (full implementation)
 return {"assignments": assignments}
```

**HF Space URL:** `https://huggingface.co/spaces/kaarya/ml-inference`
**Backend calls:** `POST https://kaarya-ml-inference.hf.space/forecast/demand`

### ML Training Pipeline

**Local development → Push to HF Space**

```bash
# Train demand forecast model
python ml/train_demand_forecast.py \
 --data data/bookings_history.csv \
 --output models/demand_forecast_v1.pkl

# Evaluate on holdout set
python ml/evaluate.py --model models/demand_forecast_v1.pkl

# If MAPE acceptable (< 25%), commit model to repo
git add ml/models/demand_forecast_v1.pkl
git commit -m "Train demand forecast v1 on synthetic+real data"

# HF Space auto-redeploys from repo
```

**Cost: ₹0.** All training happens on local machine or free Google Colab (12h sessions, free GPU).

### Cold Start Data Pipeline

**Synthetic data generation (pre-launch):**

```python
# scripts/generate_synthetic_bookings.py
# Input: cooperative-provided estimates (spreadsheet)
# Output: 12 months of synthetic booking history

# This script runs once, outputs CSV, used to bootstrap ML training
# Output committed to repo as data/synthetic_bookings_v1.csv
```

**Bootstrap → Real data integration:**

```
Month 1-3: Train on synthetic + first real bookings (weighted)
Month 3+: Synthetic weight < 30%, real data dominant
Month 6+: Train on real data only
```

### ML Models Inventory (Free-Tier Compliant)

| Model | Algorithm | Training | Inference | Hosting | Cost |
|---|---|---|---|---|---|
| Demand forecast | LightGBM | Local script | HF Space API | HF free CPU | ₹0 |
| Worker allocation | OR-Tools ILP | N/A (deterministic) | HF Space API | HF free CPU | ₹0 |
| Trust score | Weighted formula | N/A | Backend code | Railway | ₹0 |
| Cancellation prediction | LightGBM (Phase 3) | Local script | HF Space API | HF free CPU | ₹0 |
| Fraud detection | Isolation Forest (Phase 3) | Local script | HF Space API | HF free CPU | ₹0 |

**No paid ML services used.** All inference on free CPU.

### Performance Limits on Free Tier

| Service | Free CPU | Suitable for |
|---|---|---|
| HuggingFace Space (CPU) | 2 vCPU, 16GB RAM | Up to 50K predictions/day |
| Railway backend | 0.5 vCPU, 512MB RAM | Up to 5K requests/day |
| Supabase DB | Shared | Up to 100K queries/day |

**Break point:** ~5K bookings/day. Beyond that, upgrade Railway to $7/month plan, upgrade Supabase to $25/month Pro plan. Still cheap.

---

## API Specification (Free-Tier Optimized)

### Backend Stack

```
Framework: Express.js (Node.js)
Language: TypeScript
DB Client: @supabase/supabase-js
Auth: Supabase Auth (JWT tokens)
Validation: Zod
Logging: console + Supabase logs (free)
Cron: node-cron (in-process, on Railway)
```

### API Endpoints (Minimal Viable Set)

```
Auth
 POST /api/v1/auth/otp/request { phone }
 POST /api/v1/auth/otp/verify { phone, otp }
 → returns { access_token, refresh_token, user }

Workers
 GET /api/v1/workers/me → own profile
 PUT /api/v1/workers/me → update profile
 GET /api/v1/workers/me/availability → view availability
 PUT /api/v1/workers/me/availability → set availability
 GET /api/v1/workers/me/jobs?status=pending → job list
 GET /api/v1/workers/me/earnings?from=&to= → earnings

Bookings
 POST /api/v1/bookings → create booking (customer)
 GET /api/v1/bookings/:id → view booking
 POST /api/v1/bookings/:id/accept → worker accepts
 POST /api/v1/bookings/:id/reject → worker rejects
 POST /api/v1/bookings/:id/arrive → worker arrived
 POST /api/v1/bookings/:id/complete → worker completed
 POST /api/v1/bookings/:id/cancel → cancel
 POST /api/v1/bookings/:id/dispute → raise dispute
 GET /api/v1/bookings → list (filtered by role)

Matching (called internally)
 POST /api/v1/match/find → { service_id, location, time, customer_id }
 → returns ranked worker list

Payments
 POST /api/v1/payments/create-order { booking_id }
 → returns Razorpay order details
 POST /api/v1/payments/verify { razorpay_payment_id, order_id }
 → verifies and updates booking status

Settlements (admin only)
 GET /api/v1/settlements?cooperative_id=&period=
 GET /api/v1/settlements/:id
 POST /api/v1/settlements/generate → trigger settlement calculation

Ratings
 POST /api/v1/ratings { booking_id, score, comment }
 GET /api/v1/ratings/worker/:worker_id

Forecast (admin only)
 GET /api/v1/forecast/demand?service_id=&zone=&days=
 GET /api/v1/forecast/skill-gap?zone=&week=

Cooperatives
 GET /api/v1/cooperatives/me
 GET /api/v1/cooperatives/me/workers
 POST /api/v1/cooperatives/me/workers → add worker
 GET /api/v1/cooperatives/me/analytics

Federations
 GET /api/v1/federations/me
 GET /api/v1/federations/me/cooperatives
 GET /api/v1/federations/me/analytics

Welfare (worker only)
 GET /api/v1/welfare/balance
 POST /api/v1/welfare/claims

Contracts (admin)
 POST /api/v1/contracts → create AMC
 GET /api/v1/contracts/:id
 GET /api/v1/contracts/:id/jobs
```

**Total: ~35 endpoints.** Not 100+. Free-tier discipline.

---

## Mobile App Architecture (Flutter, Free-Tier)

### Offline-First Strategy

```dart
// Local storage: Hive (free, fast, no backend required)
// Sync queue: SQLite + custom sync logic
// Network detection: connectivity_plus package

// Flow:
// 1. User creates booking → write to local SQLite immediately
// 2. Attempt API call → if success, mark as synced
// 3. If no network → queue for retry when online
// 4. UI reads from local DB, shows pending sync state
```

### Push Notifications (Free)

**Option: Firebase Cloud Messaging (FCM) — Free unlimited**
- Standard Firebase free tier: unlimited notifications
- No monthly cost
- Works on iOS + Android

**Setup:**
1. Create Firebase project (free)
2. Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
3. Use `firebase_messaging` Flutter package
4. Backend stores device tokens in Supabase

**Free tier limit:** Unlimited. Truly free.

### App Stores

**Play Store:** $25 one-time fee (developer account)
**App Store:** $99/year (developer account)

**Hackathon demo:** Direct APK distribution (no store needed)
**Production:** Play Store ($25) + skip iOS for Year 1 (use responsive web instead)

### Flutter Dependencies (All Free)

```yaml
dependencies:
 flutter:
 sdk: flutter
 supabase_flutter: ^2.0.0 # Backend + auth + storage
 hive: ^2.2.3 # Local storage
 hive_flutter: ^1.1.0
 connectivity_plus: ^5.0.0 # Network detection
 geolocator: ^11.0.0 # GPS
 firebase_messaging: ^14.0.0 # Push notifications
 flutter_local_notifications: ^17.0.0
 image_picker: ^1.0.0 # Job completion photos
 signature: ^5.4.0 # Digital signature
 intl: ^0.18.0
 flutter_riverpod: ^2.4.0 # State management
 go_router: ^13.0.0 # Navigation
```

**All packages free, open-source.** No paid plugins.

---

## CI/CD (GitHub Actions Free Tier)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
 push:
 branches: [main]

jobs:
 test:
 runs-on: ubuntu-latest
 steps:
 - uses: actions/checkout@v4
 - uses: actions/setup-node@v4
 with: { node-version: '20' }
 - run: npm ci
 - run: npm test

 deploy-backend:
 needs: test
 runs-on: ubuntu-latest
 steps:
 - uses: actions/checkout@v4
 - run: npm ci && npm run build
 - uses: bervProject/railway-deploy@main
 with:
 railway_token: ${{ secrets.RAILWAY_TOKEN }}
 service: kaarya-backend

 deploy-frontend:
 needs: test
 runs-on: ubuntu-latest
 steps:
 - uses: actions/checkout@v4
 - uses: actions/setup-node@v4
 with: { node-version: '20' }
 - run: cd web && npm ci && npm run build
 - uses: amondnet/vercel-action@v25
 with:
 vercel-token: ${{ secrets.VERCEL_TOKEN }}
 vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
 vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Free tier: 2,000 min/month.** This workflow uses ~5 min per deploy. Easily within limits.

---

## Monitoring (Free Tier)

| Tool | Free Tier | What it monitors |
|---|---|---|
| **Axiom** (or Logflare) | 500GB/month logs, 14-day retention | API logs, errors |
| **Sentry** | 5K errors/month | Error tracking |
| **UptimeRobot** | 50 monitors, 5-min checks | Uptime monitoring |
| **Supabase Dashboard** | Built-in | DB queries, storage usage |
| **Railway Metrics** | Built-in | CPU, memory, network |

**All free.** No Datadog, no DataDog, no New Relic.

### Critical Alerts (Free)

| Alert | Tool | Trigger |
|---|---|---|
| API down | UptimeRobot | 5-min no response → email + SMS via MSG91 |
| Error spike | Sentry | >10 errors in 5 min |
| DB connection issues | Supabase email alerts | Connection pool exhausted |
| Payment failure | Custom webhook → MSG91 | >3 failed payments in 1 hour |
| Forecast drift | Manual weekly check | MAPE > 40% |

---

## SMS & Notifications (Free-Tier Optimized)

### MSG91 Pricing

- **DLT registration required** (India regulation)
- **Cost: ₹0.20/SMS** for transactional SMS
- **No monthly fee**

**At 500 SMS/month = ₹100/month**

### When to Use SMS vs Push

| Notification | Channel | Why |
|---|---|---|
| Job assigned | Push (if app) + SMS fallback | SMS for low-smartphone workers |
| Job starting soon (1h) | SMS | Time-critical |
| Worker arrived | Push | Customer has app |
| Payment received | SMS | Critical confirmation |
| Settlement processed | SMS | Critical |
| Forecast alert | Email + Dashboard | Admin only |
| Dispute update | Push + SMS | Both actors |

**Optimization:** Use FCM push whenever possible. SMS only as fallback or for critical messages.

**Monthly SMS budget: ₹100–500** (250–2,500 SMS).

---

## Payment Flow (Razorpay, Pay-Per-Transaction)

### Customer Payment

```
Customer taps "Pay" in app
 ↓
Backend: POST /api/v1/payments/create-order
 → Creates Razorpay order (amount: ₹1000)
 → Returns order_id + Razorpay key
 ↓
Flutter app: Opens Razorpay SDK
 → User selects UPI / card / netbanking
 → Completes payment
 ↓
Flutter app: Receives payment response
 → POST /api/v1/payments/verify { payment_id, order_id }
 ↓
Backend: Verifies signature with Razorpay key
 → Updates payment.status = 'success'
 → Updates booking.status = 'paid'
 → Triggers settlement calculation (queued)
```

**Razorpay fee: 2% per transaction** (deducted from platform share, not customer).

### Worker Payout

**Day 1-3 (no payout automation):**
- Worker requests payout via app
- Admin manually transfers via UPI/NEFT
- Marks as paid in system

**Phase 2 (with Razorpay Payouts):**
- Automated daily/weekly payouts
- Razorpay Payouts fee: ₹3.5 per payout
- At 100 payouts/day = ₹350/day = ₹10,500/month
- Defer until volume justifies

**Phase 3 (Razorpay Route for bulk transfers):**
- Single API call to disburse to all workers
- Cheaper at scale

**Decision:** Manual payouts for first 6 months. Automate at 50+ active workers.

---

## Deployment Topology

### Current (Free Tier)

```
kaarya.in (Cloudflare DNS)
 ├── api.kaarya.in → Railway (Node.js backend)
 ├── app.kaarya.in → Vercel (Customer web app)
 ├── admin.kaarya.in → Vercel (Admin dashboard)
 └── ml.kaarya.in → HuggingFace Space (ML API)
 
db: Supabase project (kaarya-prod)
storage: Supabase Storage (kaarya-prod)
auth: Supabase Auth (kaarya-prod)
```

### CI/CD Flow

```
GitHub push to main
 ↓
GitHub Actions:
 ├── Run tests
 ├── Build backend Docker image
 ├── Deploy to Railway
 ├── Build frontend
 └── Deploy to Vercel
 
ML models:
 ├── Train locally (or Colab)
 ├── Commit to repo
 └── HF Space auto-redeploys
```

### Environment Variables (Managed in Railway/Vercel dashboards)

```
DATABASE_URL=postgresql://...supabase.co...
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ... (backend only)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
MSG91_AUTH_KEY=...
MSG91_SENDER_ID=KAARYA
MSG91_ROUTE=4
GOOGLE_MAPS_API_KEY=AIza...
OPENWEATHER_API_KEY=...
ML_INFERENCE_URL=https://kaarya-ml-inference.hf.space
HF_API_TOKEN=hf_...
```

**Free tier secret management:** Railway + Vercel built-in env vars. No need for HashiCorp Vault or AWS Secrets Manager.

---

## Scaling Plan (When Free Tier Is Exhausted)

### Trigger Points & Upgrade Path

| Metric | Free Tier Limit | Upgrade Trigger | Upgrade Cost |
|---|---|---|---|
| **Railway backend hours** | 500h/month | 400h/month (80% utilized) | $7/month (unlimited hours) |
| **Supabase DB size** | 500MB | 400MB (80% utilized) | $25/month (8GB) |
| **Supabase storage** | 1GB | 800MB (80% utilized) | $25/month (100GB included) |
| **Vercel bandwidth** | 100GB | 80GB | $20/month (1TB) |
| **HuggingFace Space CPU** | 2 vCPU shared | >10K predictions/day | Upgrade to HF Pro ($9/month for dedicated CPU) |
| **MSG91 SMS volume** | Pay-per-use | No limit | Cost scales with usage |

### Total Cost at 5K Bookings/Day (Estimated)

| Service | Cost | When |
|---|---|---|
| Railway Hobby | $7/month | ~1K bookings/day |
| Supabase Pro | $25/month | ~2K bookings/day |
| Vercel Pro | $20/month | ~5K bookings/day |
| HuggingFace Pro | $9/month | ~10K predictions/day |
| MSG91 SMS | ~₹3,000/month (15K SMS) | Volume-based |
| Razorpay | 2% × GMV | Transaction-based |
| **Total fixed** | **~$61/month (₹5,000)** | At scale |
| **Variable** | **2% GMV + SMS** | Scales with revenue |

**At ₹1,000 avg booking × 5K/day = ₹15L GMV/day = ₹4.5Cr GMV/month.**
**Platform net: 5% × ₹4.5Cr = ₹22.5L/month.**
**Infrastructure cost: ₹5,000/month = 0.22% of revenue.** Negligible.

---

## Cost Discipline Principles

### What We DON'T Pay For (Until Necessary)

- ❌ **Microservices** — single monolith is sufficient until 100K+ bookings/day
- ❌ **Kubernetes** — Railway handles container orchestration
- ❌ **Managed ML platforms** (AWS SageMaker, Vertex AI) — HuggingFace free tier is enough
- ❌ **CDN beyond Cloudflare** — Cloudflare free tier is unlimited
- ❌ **Email service beyond Resend free** — 100 emails/day covers admin notifications
- ❌ **Monitoring beyond Sentry + Axiom** — Datadog is overkill at this scale
- ❌ **Load balancers** — Railway handles single-region load
- ❌ **Dedicated ML infrastructure** — HF CPU is fine until 50K predictions/day
- ❌ **Separate auth service** — Supabase Auth is built-in
- ❌ **Separate storage service** — Supabase Storage is built-in
- ❌ **Real-time DB** — Supabase Realtime subscriptions are free

### What We DO Optimize For

- ✅ Single deployable unit (Railway monolith)
- ✅ Single database (Supabase Postgres)
- ✅ Single auth (Supabase Auth)
- ✅ Single storage (Supabase Storage)
- ✅ Free ML hosting (HuggingFace Space)
- ✅ Pay-per-use only for SMS, payments, maps, weather

**Philosophy:** Every rupee of infrastructure spend should be tied to user value or operational necessity. Until PMF proven, infrastructure cost is a luxury.

---

## Implementation Roadmap (Free-Tier Aware)

### Phase 1: Foundation (Months 1–2) — ₹0/month

**Goal:** Core platform operational with 1 cooperative + 1 institution.

| Week | Deliverable | Infrastructure |
|---|---|---|
| 1 | Repo setup, Supabase project, Railway backend skeleton | All free |
| 2 | Database schema, auth integration, basic API | All free |
| 3 | Worker management (CRUD) | All free |
| 4 | Booking engine + state machine | All free |
| 5 | Matching engine (rule-based), Razorpay integration | All free |
| 6 | Settlement engine (manual payout first) | All free |
| 7 | Flutter worker app (login, jobs, complete) | FCM free |
| 8 | Flutter customer app (book, track, pay) | Razorpay SDK free |
| 9 | Admin dashboard (basic, on Vercel) | Vercel free |
| 10 | Pilot cooperative onboarding (offline data import) | All free |
| 11 | Pilot institution onboarding (AMC contract) | All free |
| 12 | First 50 test bookings | All free |

**Cost: ₹0 (Razorpay fees absorbed by platform share).**

### Phase 2: Intelligence (Months 3–4) — ₹0/month

| Week | Deliverable |
|---|---|
| 13–14 | Synthetic data generation script + initial dataset |
| 15–16 | HF Space setup + LightGBM training pipeline |
| 17–18 | Demand forecast API + federation dashboard |
| 19–20 | ILP allocation via OR-Tools (HF Space) |
| 21–22 | Forecast evaluation + A/B test setup |
| 23–24 | Skill gap detection + automated alerts |

**Cost: ₹0.** All ML on HF free CPU.

### Phase 3: Growth (Months 5–6) — ₹0–₹1,000/month

| Week | Deliverable |
|---|---|
| 25–26 | Cancellation prediction (ML-04) |
| 27–28 | Welfare dashboard + claims (admin) |
| 29–30 | Federation dashboard (full analytics) |
| 31–32 | Performance optimization, Sentry full integration |
| 33–34 | Load testing on free tier, identify limits |
| 35–36 | Documentation, handoff to operations |

**Cost: ~₹1,000/month (SMS volume increase).**

### Phase 4: Scale Triggers (Month 6+)

Only upgrade when free tier limits approached:

- 1,000+ bookings/month → consider Railway $7/month
- 50+ MB DB → stay on Supabase free (500MB limit)
- 10K+ SMS/month → still cheap (₹2,000)
- ML inference > 5K predictions/day → HF free still adequate

**At 5,000 bookings/month (still small):** Stay on free tier.

**At 10,000+ bookings/month:** Upgrade Supabase to $25/month, Railway to $7/month. Total ~$32/month (₹2,700).

---

## SIH Demo Strategy (Free-Tier Implementation)

### What Runs During Demo

| Component | Where it runs | Cost |
|---|---|---|
| Flutter mobile app demo | Phone (live) | ₹0 |
| Customer web demo | Vercel (live URL) | ₹0 |
| Admin dashboard | Vercel (live URL) | ₹0 |
| Backend API | Railway (live) | ₹0 |
| Database | Supabase (live) | ₹0 |
| ML forecast | HF Space (live, returning predictions) | ₹0 |
| Payment | Razorpay test mode | ₹0 |
| SMS | MSG91 (pre-scheduled for demo) | ₹2 |

**Total demo cost: ₹2.**

### Demo Flow (7 Minutes)

**Setup before demo:**
- Synthetic data loaded into Supabase (1 week before)
- HF Space trained on synthetic data (deploy before demo)
- Razorpay test mode enabled
- Demo account pre-created (worker: Suresh, customer: Priya)

**Act 1: Problem (30 sec)**
*[Slide: cooperative worker stats, earnings gap]*

**Act 2: Worker App (1 min)**
*[Live phone: Suresh logs in via OTP]*
*[Shows: today's schedule, 3 jobs, ₹2,100 earnings, trust score 4.7]*

**Act 3: Customer Web (1 min)**
*[Live browser: Priya books electrical service at Apex Apartments]*
*[Shows: cooperative AMC, worker profiles, Suresh's profile with cooperative badge]*

**Act 4: Matching + Assignment (1 min)**
*[Live: Suresh receives push notification]*
*[Accepts → customer sees ETA]*

**Act 5: Execution + Payment (1 min)**
*[Live: Suresh marks arrived (GPS) → completes (photo) → Priya pays ₹1,000 via Razorpay test]*

**Act 6: Money Flow Animation (1 min)**
*[Live dashboard: ₹1,000 splits into ₹700 + ₹150 + ₹50 + ₹30 + ₹50]*

**Act 7: ML Intelligence (1.5 min)**
*[Live: Federation dashboard shows demand forecast]*
*"Next Tuesday, plumbing demand in Zone A: 47 jobs predicted. Current supply: 22 plumbers. Skill gap: 25."*
*[Click: Recommendations appear — "Train 15 electricians in plumbing basics"]*

**Act 8: Close (30 sec)**
*"This runs on free-tier infrastructure. ₹0/month. Production-ready ML. Cooperative-owned economics. That's Kaarya."*

---

## What Changed from v1.0 (Original PRD)

| Original (v1.0) | Free-Tier (v2.0) | Reasoning |
|---|---|---|
| AWS/GCP | Supabase + Railway + Vercel | Free tier sufficient until 5K bookings/day |
| Managed PostgreSQL + Redis + S3 | Supabase (Postgres + PostGIS + Storage + Auth + Realtime) | Single free service replaces 5 paid ones |
| Microservices | Modular monolith | Deployment simplicity, no service mesh cost |
| Managed ML platform (SageMaker) | HuggingFace Space (free CPU) | Free tier adequate until 50K predictions/day |
| Paid push notifications (OneSignal, etc.) | Firebase Cloud Messaging (free unlimited) | Free tier truly unlimited |
| CloudWatch / DataDog | Axiom + Sentry + UptimeRobot (all free) | Free tier covers needs |
| AWS SES / SendGrid | Resend free tier (3K/month) | Free tier covers admin emails |
| IRDAI insurance integration (Phase 2) | Deferred to Phase 4 | Not needed for first ₹10L GMV |
| Razorpay Payouts (automated worker payouts) | Manual UPI transfers (Day 1-6 months) | Automate when volume justifies cost |

**Total v1.0 monthly cost: ₹15,000–₹50,000.**
**Total v2.0 monthly cost: ₹0–₹1,000.**

**Difference: 95%+ cost reduction.** Without compromising production-readiness or ML capability.

---

## Honest Limitations of Free Tier

### What We Cannot Do on Free Tier

1. **No high-availability deployment** — single Railway instance can go down. Mitigation: UptimeRobot alerts + auto-restart on Railway.
2. **No multi-region** — single region (Railway default). Acceptable for India-only launch.
3. **Limited DB connections** — Supabase free tier has connection limits. Mitigation: use Supavisor (built-in connection pooler) + efficient queries.
4. **No dedicated CPU** — HF Space is shared CPU. ML inference may have higher latency during peak hours. Acceptable for non-real-time predictions.
5. **No 24/7 support** — free tiers have community support only. Acceptable for early-stage product.
6. **Manual backups** — Supabase free tier doesn't include automated backups. Mitigation: weekly `pg_dump` via cron + free Cloudflare R2 (10GB free) for backup storage.

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Railway goes down | UptimeRobot alert → manual restart or migrate to Render |
| Supabase outage | Read replicas on free tier; fallback to cached data in Flutter app |
| HF Space slow inference | Cache predictions in Redis (free); refresh every 6 hours |
| Free tier quota exceeded | Upgrade to next tier (cost ~₹500/month) |
| Cold start delays | Keep services warm via cron pings (Render) or use Railway (no cold start) |

**Bottom line:** Free tier is a deliberate discipline, not a compromise. It forces lean architecture that scales gracefully when revenue justifies paid tiers.

---

## Final Architecture Summary (Free-Tier)

### Stack at a Glance

| Layer | Service | Free Tier Limit | Cost |
|---|---|---|---|
| **Frontend (Web)** | Vercel | 100GB bandwidth | ₹0 |
| **Mobile** | Flutter + Play Store | $25 one-time | ₹2,100 one-time |
| **Backend** | Railway | $5 credit/month (~500h) | ₹0 |
| **Database** | Supabase | 500MB, 50K MAU | ₹0 |
| **Auth** | Supabase Auth | 50K MAU | ₹0 |
| **Storage** | Supabase Storage | 1GB | ₹0 |
| **Realtime** | Supabase Realtime | 200 concurrent | ₹0 |
| **ML Inference** | HuggingFace Space | 2 vCPU shared | ₹0 |
| **ML Training** | Local + Google Colab | 12h GPU sessions | ₹0 |
| **Push Notifications** | Firebase Cloud Messaging | Unlimited | ₹0 |
| **Email** | Resend | 100/day | ₹0 |
| **SMS** | MSG91 | Pay-per-use | ₹100-500/month |
| **Payments** | Razorpay | 2% per txn | 2% of GMV |
| **Maps** | Google Maps Platform | $200 credit/month | ₹0 (within credit) |
| **Weather** | OpenWeatherMap | 1M calls/month | ₹0 |
| **Monitoring** | Sentry + Axiom + UptimeRobot | Generous free tiers | ₹0 |
| **CI/CD** | GitHub Actions | 2,000 min/month | ₹0 |
| **DNS + CDN** | Cloudflare | Unlimited | ₹0 |
| **Domain** | Namecheap / Cloudflare Registrar | ~₹800/year | ₹67/month |
| **Total monthly** | | | **₹0–₹1,000** |

### Break-Even

**At 100 bookings/month:** ₹5,000 GMV → ₹250 platform revenue → covers SMS + domain.
**At 1,000 bookings/month:** ₹50,000 GMV → ₹2,500 platform revenue → profitable.
**At 10,000 bookings/month:** ₹5,00,000 GMV → ₹25,000 platform revenue → ready for paid tier upgrades.

---

## Conclusion

Kaarya can be built, deployed, and operated at **production-grade quality on a free-tier architecture**. The constraint forces discipline: no microservices, no managed ML platforms, no paid monitoring. Instead: Supabase as the consolidated backend, Railway for the monolith, HuggingFace for ML, and pay-per-use only for transactions and SMS.

When revenue justifies it, upgrades are cheap and well-understood:
- $7/month Railway for unlimited backend hours
- $25/month Supabase for 8GB DB + 100GB storage
- $9/month HuggingFace Pro for dedicated ML CPU

The discipline isn't about being cheap. It's about **building a business where infrastructure cost is negligible relative to revenue**, so every booking is profitable from Day 1.

**That's the free-tier perspective. Build lean. Scale when revenue proves it.**


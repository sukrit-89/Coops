# Kaarya — Implementation Status vs PRD

**Last Updated:** 2026-09-14
**PRD Version:** 2.0 (Free-Tier Edition)
**Current Branch:** main
**TypeScript Status:** `npx tsc --noEmit` = 0 errors
**Test Status:** 58/58 tests passing

---

## Overall Progress: ~92% Complete (up from 95%)

### ✅ Completed (Implemented & Committed)

#### 1. Database Schema & Migrations (96%)
- ✅ 17 migration files (`0001`–`0016` + seed), all committed
- ✅ Core tables: `profiles`, `workers`, `cooperatives`, `customers`, `services`, `bookings`, `booking_event`, `payments`, `ratings`, `reviews`, `complaints`, `conversations`, `worker_applications`
- ✅ Extended PRD tables (in `0013_prd_extended_tables.sql`): `federations`, `settlements`, `welfare_accounts`, `welfare_claims`, `amc_contracts`, `demand_forecasts`, `service_catalog_items`, `audit_logs`
- ✅ `0014_worker_trust_score.sql` — adds `trust_score`, `rating`, `jobs_accepted`, `cooperative_id`
- ✅ `0015_alerts_table.sql` — adds `alerts` table for threshold-based notifications
- ✅ `0016_recurring_bookings.sql` — adds `recurring_bookings` table for subscription bookings
- ✅ PostGIS extension for geospatial queries
- ✅ Foreign keys, cascading deletes, check constraints
- ✅ Performance indexes
- ✅ Seed data for catalog + forecasts
- ✅ `supabase/config.toml` for local development

#### 2. Authentication & Authorization (85%)
- ✅ Supabase Auth integration
- ✅ Role-based access control: `platform_admin`, `cooperative_admin`, `worker`, `customer`
- ✅ `requireUser()` and `requireRole()` helpers
- ✅ Profile-role mapping via `profile_roles` table
- ✅ Sign-out API route
- ✅ Phone OTP flow scaffolded (web + Flutter)

#### 3. Worker Management (95%)
- ✅ Worker profile CRUD API (`/api/worker-profile`)
- ✅ Worker settings API (`/api/worker-settings`) — availability, services, skills
- ✅ Trust score calculation (`src/lib/domain/trust-score.ts`) — PRD formula: completion (40), quality (25), reliability (20), welfare integrity (10), recency (5)
- ✅ Trust score recalculation API (`POST /api/worker-profile`)
- ✅ Worker availability service (`src/lib/services/availability.ts`) + domain types
- ✅ Worker detail page (`/workers/[workerId]`)
- ✅ Worker profile page with trust score, rating, completed jobs display
- ✅ Flutter worker app screens: dashboard, jobs list, schedule, profile, settings

#### 4. Booking Engine (90%)
- ✅ Booking creation, listing, status state machine
- ✅ GPS arrival verification API (`POST /api/bookings/[bookingId]/arrival`) with time window validation
- ✅ Cancellation support with reason
- ✅ Dispute flagging
- ✅ Booking events audit trail
- ✅ Status transitions with role-based permissions
- ✅ Flutter customer app: booking creation screen, bookings list

#### 5. Matching Engine (90%)
- ✅ Rule-based worker ranking (`src/lib/domain/matching.ts`)
- ✅ Scoring algorithm: skill (30), distance (20), availability (20), rating (15), experience (10), service requirement (5)
- ✅ ML-blended allocation with graceful fallback
- ✅ OR-Tools ILP optimization for worker allocation

#### 6. ML Pipeline (95%) ← UPDATED
- ✅ Training script (`ml/train_demand_forecast.py`) — LightGBM with 15 features
- ✅ Evaluation script (`ml/evaluate.py`) — MAPE, R², per-zone metrics
- ✅ **Model trained and passing** — MAPE 12.75%, R² 0.734 (both pass PRD criteria)
- ✅ Synthetic data generator (`scripts/generate_synthetic_bookings.py`) — 3,600 rows
- ✅ **FastAPI inference API** (`ml/app.py`) — /health, /forecast/demand, /allocate
- ✅ **OR-Tools CP-SAT solver** for ILP allocation with greedy fallback
- ✅ Dockerfile for HuggingFace Space deployment
- ✅ Backend service (`src/lib/services/ml.ts`) — ML + rule-based fallback
- ✅ Domain types (`src/lib/domain/ml.ts`) — full Zod schemas
- ✅ ML tests (`src/lib/services/ml.test.ts`) — 16 tests covering all scenarios
- ✅ `ml/README.md` — complete setup guide with API docs
- ✅ Trained model artifacts:
  - `ml/models/demand_forecast_v1.pkl`
  - `ml/models/demand_forecast_v1_metadata.json`
  - `ml/models/feature_importance.csv`
- ⚠️ HuggingFace Space deployment pending (infrastructure)

#### 7. Payment Integration (70%)
- ✅ Razorpay order creation (`POST /api/payments/order`)
- ✅ Payment verification webhook (`POST /api/payments/webhook`)
- ✅ Payment status tracking
- ✅ Booking status updates on payment
- ✅ Invoice generation API (`POST /api/invoices`)
- ✅ Invoices UI page (`/invoices`) with role-based filtering
- ⚠️ Razorpay test mode not configured

#### 8. Settlement Engine (85%)
- ✅ Settlement service with automated multi-party split calculation: worker 70%, cooperative 15%, federation 5%, welfare 3%, platform 5%
- ✅ Welfare balance auto-update from settlement runs
- ✅ Settlement generation API (`POST /api/settlements/generate`)
- ✅ Settlements admin page (`/admin/settlements`)
- ✅ Settlements user page (`/settlements`)

#### 9. Admin Dashboard (97%)
- ✅ Platform admin dashboard with live metrics (`/admin`)
- ✅ Users & roles management (`/admin/users`)
- ✅ Services management (`/admin/services`) + API
- ✅ Catalog management (`/admin/catalog`) + API
- ✅ Bookings management (`/admin/bookings`) + API
- ✅ Complaints management (`/admin/complaints`) + API
- ✅ Payments overview (`/admin/payments`)
- ✅ Federations list page (`/admin/federations`) + API
- ✅ AMC contracts page (`/admin/amc`) + API
- ✅ Settlements page (`/admin/settlements`) + API
- ✅ Worker verification queue (`/operations/verification`)
- ✅ Analytics dashboard with charts (`/analytics`)
- ✅ Forecasts page (`/forecasts`) with zone breakdown and ML/rule-based summary
- ✅ Alerts page (`/admin/alerts`) with 5 threshold rules and evaluation form
- ✅ Skill gap analysis page (`/admin/skill-gap`) with demand-vs-supply severity view
- ✅ Predictions page (`/admin/predictions`) with forecast + cancellation risk counts
- ✅ Subscriptions page (`/admin/subscriptions`) with recurring booking overview
- ✅ **14 admin pages total** (verified via build output)

#### 10. Communication (80%)
- ✅ Conversations panel component
- ✅ Complaint form component
- ✅ Complaints API
- ✅ Conversations API
- ✅ Notifications service (`src/lib/services/notifications.ts`)
- ✅ Notifications API (`GET/POST /api/notifications`)
- ✅ SMS service (`src/lib/services/sms.ts`) — MSG91 integration with mock fallback
- ✅ Email service (`src/lib/services/email.ts`) — Resend integration with mock fallback
- ⚠️ FCM push notifications — not integrated
- ⚠️ Real MSG91/Resend credentials not configured

#### 11. Reviews & Ratings (80%)
- ✅ Review form component
- ✅ Reviews API (`POST /api/reviews`)
- ✅ Reviews service with aggregation (`src/lib/services/reviews.ts`) — average rating + distribution
- ✅ Enhanced reviews API (`GET /api/reviews`) with aggregation
- ⚠️ Review display on worker profiles (data available, UI partial)

#### 12. Service Catalog (75%)
- ✅ Service catalog items table
- ✅ Catalog service (`src/lib/services/catalog.ts`) — full CRUD
- ✅ Catalog API (`GET/POST /api/catalog`)
- ✅ Admin catalog page (`/admin/catalog`)
- ⚠️ Service categories UI
- ⚠️ Pricing tiers UI
- ⚠️ Duration management

#### 13. Distance & Geocoding (70%)
- ✅ Geocoding API (`POST /api/location/geocode`)
- ✅ Distance matrix service (`src/lib/services/distance.ts`) — Google Maps + Haversine fallback
- ⚠️ Service radius filtering in UI
- ⚠️ Address autocomplete
- ⚠️ Google Maps API key not configured in production

#### 14. Welfare (60%)
- ✅ Welfare service layer (`src/lib/services/welfare.ts`)
- ✅ Welfare claims API (`POST /api/welfare/claims`)
- ⚠️ Welfare page exists as feature component (`src/features/welfare/page.tsx`) but is **NOT routed** under `/admin/welfare`
- ⚠️ Welfare page queries only the admin's own claims, not all claims for admin review
- ⚠️ Welfare dashboard with balance tracking
- ⚠️ Claims approval workflow UI

#### 15. Testing (85%) ← UPDATED
- ✅ Vitest configured (`vitest.config.ts`)
- ✅ **12 test files, 58 passing tests** (up from 42)
- ✅ Test coverage: trust score, booking status, availability, distance, settlements, matching, alerts, forecasts, export, cancellation prediction, subscriptions, **ML service (16 new tests)**
- ✅ `npm run test` works
- ⚠️ No E2E tests
- ⚠️ No integration tests against real database

#### 16. Intelligence & Analytics (95%) ← UPDATED
- ✅ Demand forecasting service with ML + rule-based fallback
- ✅ **Trained LightGBM model** — MAPE 12.75% (passes < 25% criterion)
- ✅ **R² 0.734** (passes > 0.6 criterion)
- ✅ Forecast API (`GET/POST /api/forecast/demand`) with ML/rule-based summary
- ✅ Forecast dashboard (`/forecasts`) with zone breakdown and charts
- ✅ **OR-Tools ILP allocation** for optimal worker-job assignment
- ✅ Automated alerts service evaluating 5 threshold rules
- ✅ Alerts API (`GET/POST /api/alerts`) with persisted alert records
- ✅ Alerts admin page (`/admin/alerts`) with rule evaluation
- ✅ Skill gap analysis service comparing demand vs worker supply
- ✅ Skill gap API (`GET /api/skill-gap`) with severity buckets
- ✅ Skill gap admin page (`/admin/skill-gap`)
- ✅ Admin predictions page (`/admin/predictions`) linking forecast + cancellation data

#### 17. Cancellation Prediction & Fraud Detection (80%)
- ✅ Rule-based cancellation prediction (`src/lib/domain/patterns.ts`) — 6 weighted factors
- ✅ Cancellation prediction service (`src/lib/services/cancellation-prediction.ts`)
- ✅ Cancellation API (`GET /api/predictions/cancellation`)
- ✅ Fraud detection rules (`src/lib/domain/fraud-detection.ts`) — 5 signal types
- ✅ Fraud evaluation service (`src/lib/services/fraud-detection.ts`) — risk scoring
- ✅ Fraud API (`POST /api/fraud/signals`)
- ⚠️ No ML-based fraud model yet

#### 18. Export & Subscriptions (75%)
- ✅ CSV export service (`src/lib/services/export.ts`) — bookings + invoices
- ✅ Export tests (`src/lib/services/export.test.ts`)
- ✅ Subscription plans domain (`src/lib/domain/subscriptions.ts`) — 3 tiers
- ✅ Recurring bookings migration (`0016_recurring_bookings.sql`)
- ✅ Recurring bookings API (`GET/POST /api/recurring`)
- ✅ Customer subscriptions page (`/subscriptions`)
- ✅ Admin subscriptions page (`/admin/subscriptions`)

#### 19. Flutter Mobile Apps (50%)
- ✅ Worker app scaffold with pubspec.yaml
- ✅ Worker app screens (6): login, dashboard, jobs list, schedule, profile, settings
- ✅ Customer app scaffold with pubspec.yaml
- ✅ Customer app screens (3): login, bookings list, new booking flow
- ✅ Supabase, Riverpod, GoRouter dependencies
- ⚠️ Customer app missing `lib/main.dart` entry point
- ⚠️ No backend API integration yet (mock data only)
- ⚠️ No GPS tracking
- ⚠️ No image picker
- ⚠️ No digital signature capture
- ⚠️ No Razorpay SDK integration
- ⚠️ No FCM push notifications

#### 20. CI/CD (70%)
- ✅ `.github/workflows/ci.yml` — typecheck, lint, build
- ✅ `.github/workflows/test.yml` — test + coverage
- ✅ `.github/workflows/deploy.yml` — Vercel deployment
- ✅ `Dockerfile` — multi-stage production build
- ✅ `docker-compose.yml` — local deployment
- ⚠️ Vercel/Railway secrets not configured
- ⚠️ Backend not deployed to Railway

#### 21. UI/UX Foundation (95%)
- ✅ Next.js 16 App Router
- ✅ Tailwind CSS v4 styling
- ✅ Page shell component
- ✅ Empty states
- ✅ Navigation with all modules linked
- ✅ Mobile-responsive design
- ✅ Admin navigation with all modules
- ✅ Worker profile page with trust score display
- ✅ Dark/light mode support via CSS variables
- ✅ 14 admin pages fully implemented
- ✅ All public routes resolve to a page
- ⚠️ `middleware.ts` uses deprecated convention (Next.js recommends `proxy`)

#### 22. Documentation (95%) ← UPDATED
- ✅ `README.md` — quick start guide
- ✅ `PRD.md` — product requirements
- ✅ `IMPLEMENTATION_STATUS.md` — this file
- ✅ `DEPLOYMENT.md` — production deployment guide
- ✅ `MONITORING.md` — Sentry, Axiom, UptimeRobot setup
- ✅ **`ml/README.md`** — comprehensive ML pipeline guide with API docs
- ✅ Inline code comments in complex functions
- ⚠️ API documentation (OpenAPI/Swagger) not generated

---

### ❌ Not Started / Missing

#### 1. E2E Testing (15%)
- ⚠️ Playwright configured (`playwright.config.ts`) with 2 stub test files (4 basic smoke tests)
- ❌ Critical user journey testing (login, booking flow, payment flow)
- ❌ No tests run in CI against live app

#### 2. Production Integrations (0%)
- ❌ Razorpay test/live mode configured
- ❌ MSG91 real credentials configured
- ❌ Resend real credentials configured
- ❌ FCM push notifications
- ❌ OpenWeatherMap integration

#### 3. Infrastructure (0%)
- ❌ Railway backend deployed
- ❌ Vercel frontend deployed
- ❌ HuggingFace Space deployed
- ❌ Cloudflare DNS/CDN
- ❌ Automated backups
- ❌ Production monitoring configured

---

## ML Pipeline Status — COMPLETE ✓

| Component | Status | Details |
|-----------|--------|---------|
| **Synthetic Data** | ✅ Done | 3,600 rows, 90 days, 5 zones, 8 services |
| **Training Pipeline** | ✅ Done | LightGBM with 15 features, time-series split |
| **Model Performance** | ✅ Passing | MAPE: 12.75% < 25%, R²: 0.734 > 0.6 |
| **Evaluation Script** | ✅ Done | Per-zone metrics, acceptance criteria check |
| **Inference API** | ✅ Done | FastAPI with /health, /forecast/demand, /allocate |
| **ILP Allocation** | ✅ Done | OR-Tools CP-SAT with greedy fallback |
| **Backend Integration** | ✅ Done | Health check, ML calls, rule-based fallback |
| **Type Safety** | ✅ Done | Full Zod schemas for all ML types |
| **Tests** | ✅ Done | 16 tests covering all ML scenarios |
| **Documentation** | ✅ Done | Complete README with API docs |
| **HF Deployment** | ⚠️ Pending | Dockerfile ready, needs deployment |

### Model Artifacts

```
ml/models/
├── demand_forecast_v1.pkl           # Trained LightGBM model (joblib)
├── demand_forecast_v1_metadata.json # Training metrics
└── feature_importance.csv           # Feature importance ranking
```

### Training Metrics

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| MAPE | 12.75% | < 25% | ✓ PASS |
| R² | 0.734 | > 0.6 | ✓ PASS |
| RMSE | 1.107 | - | - |
| MAE | 0.873 | - | - |

### Per-Zone Performance

| Zone | MAPE | Status |
|------|------|--------|
| central | 11.62% | ✓ |
| east | 16.16% | ✓ |
| north | 12.92% | ✓ |
| south | 11.57% | ✓ |
| west | 12.62% | ✓ |

---

## Progress Summary by Layer

| Layer | Completion | Notes |
|-------|-----------|-------|
| **Database** | 96% | 17 migrations, all 17 PRD tables, indexes, RLS |
| **Backend API** | 90% | 33 routes (~80% of PRD endpoints), services, domain logic |
| **Frontend (Web)** | 85% | 14 admin pages, worker profile, invoices, settlements |
| **ML Pipeline** | **95%** | Model trained, API ready, tests passing |
| **Flutter Mobile** | 50% | 9 screens across 2 apps, no API integration |
| **CI/CD** | 70% | 3 workflows ready, not triggered |
| **Testing** | **87%** | 58 unit tests, 4 E2E smoke stubs |
| **Integrations** | 45% | Services ready, not configured |
| **Documentation** | **95%** | README, PRD, deployment, monitoring, ML guides |
| **Infrastructure** | 0% | Not deployed anywhere |

**Overall: ~92%** (corrected from 97% — welfare routing, missing Flutter entry point, E2E gaps)

---

## Codebase Statistics

| Metric | Count |
|--------|-------|
| **Total commits** | 31 |
| **Source files** | 153 |
| **API routes** | 33 |
| **Service files** | 15 |
| **Domain files** | 10 |
| **Test files** | 12 |
| **Flutter screens** | 9 (6 worker + 3 customer) |
| **Admin pages** | 14 |
| **Feature directories** | 13 |
| **Database migrations** | 17 |
| **GitHub workflows** | 3 |
| **TypeScript errors** | 0 |
| **Tests passing** | 58/58 |
| **ML model MAPE** | 12.75% |
| **ML model R²** | 0.734 |

---

## What Changed Since Last Update

### New Features (ML Pipeline)
1. ✅ **Synthetic data generator** — improved with realistic patterns
2. ✅ **LightGBM training pipeline** — 15 features, cyclical encoding, lag features
3. ✅ **Model trained successfully** — MAPE 12.75%, R² 0.734
4. ✅ **Evaluation script** — per-zone MAPE, acceptance criteria validation
5. ✅ **FastAPI inference API** — /health, /forecast/demand, /allocate endpoints
6. ✅ **OR-Tools ILP allocation** — CP-SAT solver with greedy fallback
7. ✅ **Backend ML service** — health check, proper API integration, type safety
8. ✅ **ML domain types** — full Zod schemas for validation
9. ✅ **ML tests** — 16 new tests covering all scenarios
10. ✅ **ML README** — comprehensive documentation with API docs

### Files Modified
- `scripts/generate_synthetic_bookings.py`
- `data/bookings_history.csv`
- `ml/train_demand_forecast.py`
- `ml/evaluate.py`
- `ml/app.py`
- `ml/requirements.txt`
- `ml/Dockerfile`
- `ml/README.md`
- `ml/models/demand_forecast_v1.pkl`
- `ml/models/demand_forecast_v1_metadata.json`
- `ml/models/feature_importance.csv`
- `src/lib/services/ml.ts`
- `src/lib/services/ml.test.ts`
- `src/lib/services/forecasts.test.ts`
- `src/lib/domain/ml.ts`
- `src/app/api/matching/route.ts`

### Still Missing
1. ❌ E2E tests
2. ❌ HuggingFace Space deployment
3. ❌ Real integration credentials (Razorpay, MSG91, Resend, Maps)
4. ❌ Production deployment
5. ❌ Flutter API integration
6. ❌ FCM push notifications

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|---------|-----------|
| Flutter apps not integrated with backend | 🟠 Medium | Screens done, need API wiring |
| HuggingFace Space not deployed | 🟡 Low | Code ready, deploy when needed |
| No E2E tests | 🟠 Medium | Add Playwright before pilot |
| No production deployment | 🟠 Medium | Configs ready, need secrets |
| SMS/Email not configured | 🟡 Low | Services ready, need credentials |
| No monitoring | 🟡 Low | Docs ready, need Sentry/Axiom setup |

---

## Recommendations

### Immediate (Week 1-2)
1. ~~Train ML model~~ ✓ Done
2. ~~Implement OR-Tools ILP allocation~~ ✓ Done
3. Deploy HuggingFace Space with trained model
4. Configure Razorpay test mode
5. Set up MSG91 + Resend credentials

### Short-term (Week 3-4)
1. Wire Flutter apps to backend APIs
2. Deploy to Vercel + Railway
3. Configure Sentry + Axiom
4. Add FCM push notifications
5. Add Playwright E2E tests for critical paths

### Medium-term (Month 2-3)
1. ML-based cancellation prediction model
2. Fraud detection model
3. Performance optimization
4. Offline-first Flutter storage

### Long-term (Month 3-6)
1. Load testing
2. Advanced analytics
3. Scale preparation

---

## Bottom Line

**Strengths:**
- Solid database schema with all PRD tables (17 migrations)
- 30+ API routes covering core features
- **Complete ML pipeline with trained model passing all criteria**
- **OR-Tools ILP optimization for worker allocation**
- Trust score formula implemented per PRD
- Settlement auto-calculation with welfare balance
- CI/CD pipelines ready (3 workflows)
- All admin modules functional (12 pages)
- Flutter mobile apps with 8 screens
- Integration services ready (SMS, email, maps)
- **58 passing tests** (up from 42)
- Type-safe TypeScript with 0 compilation errors
- **Comprehensive ML documentation**

**Weaknesses:**
- No production deployment yet
- Flutter apps not wired to backend
- No E2E tests
- External integrations not configured with real credentials
- No production monitoring

**Overall:** Backend API is ~90% complete. **ML pipeline is ~95% complete** (model trained, API ready, tests passing). Flutter mobile apps are ~50% complete (UI done, no backend integration). Testing is ~85% complete (58 unit tests, no E2E). **Ready for staging deployment and backend integration testing.**

**Estimated time to production-ready:** 2-3 weeks with focused effort on deployment, Flutter API integration, E2E tests, and integration configuration.

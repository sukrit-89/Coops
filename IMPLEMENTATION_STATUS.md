# Kaarya — Implementation Status vs PRD

**Last Updated:** 2026-09-13 (after ML pipeline commit `39a1b26`)
**PRD Version:** 2.0 (Free-Tier Edition)
**Current Branch:** main
**TypeScript Status:** `npx tsc --noEmit` = 0 errors

---

## Overall Progress: ~72% Complete

### ✅ Completed (Implemented & Committed)

#### 1. Database Schema & Migrations (95%)
- ✅ 14 migration files (`0001`–`0013` + seed), 1,435 total lines
- ✅ Core tables: `profiles`, `workers`, `cooperatives`, `customers`, `services`, `bookings`, `booking_event`, `payments`, `ratings`, `reviews`, `complaints`, `conversations`, `worker_applications`
- ✅ Extended PRD tables (in `0013_prd_extended_tables.sql`): `federations`, `settlements`, `welfare_accounts`, `welfare_claims`, `amc_contracts`, `demand_forecasts`, `service_catalog_items`, `audit_logs`
- ✅ `federation_id` FK added to `cooperatives`
- ✅ PostGIS extension for geospatial queries
- ✅ Foreign keys, cascading deletes, check constraints
- ✅ Performance indexes (GIST on location, B-tree on status/cooperative/skills)
- ✅ Seed data for catalog + forecasts
- ⚠️ RLS policies: partially implemented (some tables have policies, but not comprehensive)

#### 2. Authentication & Authorization (85%)
- ✅ Supabase Auth integration (server-side client + admin client)
- ✅ Phone OTP flow scaffolded (pages + API)
- ✅ Role-based access control: `platform_admin`, `cooperative_admin`, `worker`, `customer`
- ✅ `requireUser()` and `requireRole()` helpers with proper error handling
- ✅ Profile-role mapping via `profile_roles` table
- ✅ Auth pages: login, OTP verification, sign-up
- ✅ Sign-out API route

#### 3. Worker Management (85%)
- ✅ Worker profile CRUD API (`/api/worker-profile`)
- ✅ Worker settings API (`/api/worker-settings`)
- ✅ Worker application/onboarding form component
- ✅ Worker discovery/search with filtering (`/features/discovery/`)
- ✅ Worker cards and profile view
- ✅ Worker detail page (`/workers/[workerId]`)
- ✅ Trust score calculation in domain logic
- ✅ Worker verification actions (`/features/operations/`)
- ⚠️ Availability management: partial (data exists but no full calendar UI)

#### 4. Booking Engine (80%)
- ✅ Booking creation API (`POST /api/bookings`)
- ✅ Booking listing with filters
- ✅ Booking status state machine (`src/lib/domain/booking-status.ts`)
- ✅ Status transitions: pending → matching → assigned → accepted → arrived → completed → paid
- ✅ Cancellation support with reason
- ✅ Dispute flagging
- ✅ Booking events audit trail table
- ✅ Booking form component
- ⚠️ Arrival verification (GPS-based) — API exists, UI partial
- ⚠️ Completion photo upload — not implemented

#### 5. Matching Engine (85%) ← IMPROVED
- ✅ Rule-based worker ranking (`src/lib/domain/matching.ts`)
- ✅ Scoring algorithm: skill (30), distance (20), availability (20), rating (15), experience (10), service requirement (5)
- ✅ Matching API endpoint (`POST /api/matching`)
- ✅ ML-blended allocation: calls `/api/allocation` which proxies to HF Space
- ✅ Graceful fallback to rule-based when ML service unavailable
- ✅ `mlBlended` flag in response

#### 6. ML Pipeline (75%) ← NEW / MAJOR IMPROVEMENT
- ✅ Training script (`ml/train_demand_forecast.py`) — LightGBM with synthetic data support
- ✅ Evaluation script (`ml/evaluate.py`) — MAPE/RMSE/MAE metrics, acceptance criteria (MAPE < 25%)
- ✅ Inference API (`ml/app.py`) — FastAPI with `/forecast/demand` and `/allocate` endpoints
- ✅ Synthetic data generator (`scripts/generate_synthetic_bookings.py`)
- ✅ Dockerfile for HuggingFace Space deployment
- ✅ `ml/requirements.txt` with all dependencies
- ✅ `ml/README.md` with setup instructions
- ✅ Backend service (`src/lib/services/ml.ts`) — calls `ML_INFERENCE_URL`
- ✅ Domain types (`src/lib/domain/ml.ts`)
- ✅ Forecast repository (`src/lib/repositories/forecasts.ts`) — upsert + list
- ✅ API routes: `POST /api/forecast/demand` and `POST /api/allocation`
- ✅ Forecasts data persisted to `demand_forecasts` table
- ⚠️ Model not yet trained (`models/demand_forecast_v1.pkl` doesn't exist)
- ⚠️ HuggingFace Space not deployed
- ⚠️ Cancellation prediction, fraud detection models not started

#### 7. Payment Integration (70%)
- ✅ Razorpay order creation (`POST /api/payments/order`)
- ✅ Payment verification webhook (`POST /api/payments/webhook`)
- ✅ Payment status tracking
- ✅ Booking status updates on payment
- ✅ Payment button component
- ⚠️ Refund handling
- ⚠️ Payment history/receipts page
- ⚠️ Razorpay test mode not configured in environment

#### 8. Settlement Engine (60%)
- ✅ Settlement listing API (`GET /api/settlements`)
- ✅ Settlement service layer with create/list
- ✅ Welfare service layer (claims, accounts)
- ✅ Welfare claims API (`POST /api/welfare/claims`)
- ✅ Welfare admin page
- ⚠️ Automated settlement calculation (formula exists in PRD, not in code)
- ⚠️ Payout marking as paid
- ⚠️ Federation/cooperative/welfare splits

#### 9. Admin Dashboard (75%) ← IMPROVED
- ✅ Platform admin dashboard with live metrics (`/admin`)
- ✅ Users & roles management (`/admin/users`)
- ✅ Services management (`/admin/services`) + API
- ✅ Bookings management (`/admin/bookings`) + API
- ✅ Complaints management (`/admin/complaints`) + API
- ✅ Payments overview (`/admin/payments`)
- ✅ Federations list page (`/admin/federations`) + API
- ✅ AMC contracts page (`/admin/amc`) + API
- ✅ Worker verification queue (`/operations/verification`)
- ✅ Analytics dashboard with charts (`/analytics`)
- ⚠️ Analytics page exists but not linked from dashboard (linked from admin now)
- ⚠️ Invoice generation page exists but no generation logic
- ⚠️ Worker verification queue UI partial

#### 10. Communication (70%)
- ✅ Conversations panel component
- ✅ Complaint form component
- ✅ Complaints API (list, create, admin update)
- ✅ Conversations API
- ⚠️ SMS notifications (MSG91) — not integrated
- ⚠️ Push notifications (FCM) — not integrated
- ⚠️ Email notifications (Resend) — not integrated
- ⚠️ Notification preferences

#### 11. Reviews & Ratings (70%)
- ✅ Review form component
- ✅ Reviews API (`POST /api/reviews`)
- ⚠️ Rating aggregation on worker profiles
- ⚠️ Verified booking badge
- ⚠️ Review display on worker profiles

#### 12. Cooperatives (65%)
- ✅ Cooperative data model with federation FK
- ✅ Cooperative members listing
- ✅ Cooperative admin role
- ⚠️ Cooperative onboarding flow
- ⚠️ Worker assignment to cooperatives
- ⚠️ Cooperative-level analytics

#### 13. Federations (60%)
- ✅ Federation data model
- ✅ Federation API routes (list, create)
- ✅ Federation admin page
- ⚠️ Federation-level analytics
- ⚠️ Cooperative-to-federation mapping UI
- ⚠️ Federation-wide demand forecasts display

#### 14. Demand Forecasting (70%) ← IMPROVED
- ✅ Demand forecast data model
- ✅ Forecast repository (upsert, list)
- ✅ Forecast API route (calls ML service, persists results)
- ✅ ML training pipeline
- ✅ ML inference service
- ✅ Seed data for forecasts
- ⚠️ Model not yet trained (no `.pkl` file)
- ⚠️ HuggingFace Space not deployed
- ⚠️ Confidence intervals visualization in UI

#### 15. Service Catalog (55%)
- ✅ Service catalog items table
- ✅ Catalog API (list, create)
- ⚠️ Service categories
- ⚠️ Pricing tiers
- ⚠️ Duration management
- ⚠️ Catalog UI page

#### 16. Location & Geocoding (45%)
- ✅ Geocoding API (`POST /api/location/geocode`)
- ⚠️ Distance matrix API integration (Google Maps)
- ⚠️ Service radius filtering in UI
- ⚠️ Address autocomplete

#### 17. UI/UX Foundation (90%)
- ✅ Next.js 14 App Router
- ✅ Tailwind CSS styling
- ✅ Page shell component
- ✅ Empty states
- ✅ Navigation (sidebar/topbar)
- ✅ Mobile-responsive design
- ✅ Dark/light mode support via CSS variables
- ✅ i18n scaffolding (`src/lib/i18n/`)
- ✅ Admin navigation with all modules linked

---

### ❌ Not Started / Missing

#### 1. Flutter Mobile Apps (0%)
- ❌ Worker mobile app (Flutter)
- ❌ Customer mobile app (Flutter)
- ❌ Offline-first storage (Hive)
- ❌ FCM push notifications
- ❌ GPS tracking
- ❌ Image picker for completion photos
- ❌ Digital signature capture
- ❌ Razorpay SDK integration in Flutter

#### 2. CI/CD (0%)
- ❌ GitHub Actions workflow (`.github/workflows/deploy.yml`)
- ❌ Automated testing pipeline
- ❌ Railway backend deployment
- ❌ Vercel frontend deployment
- ❌ Database migration automation

#### 3. Testing (0%)
- ❌ Unit tests
- ❌ Integration tests
- ❌ E2E tests
- ❌ Load testing
- ❌ Security testing

#### 4. External Integrations (0-10%)
- ❌ Razorpay test mode configuration
- ❌ MSG91 SMS integration
- ❌ FCM push notifications
- ❌ Resend email integration
- ❌ Google Maps Distance Matrix API
- ❌ OpenWeatherMap integration
- ❌ Monitoring (Sentry, Axiom, UptimeRobot)

#### 5. Advanced Features (0-20%)
- ❌ Trust score calculation formula in code
- ❌ Cancellation prediction model
- ❌ Fraud detection
- ❌ Skill gap detection
- ❌ Automated alerts system
- ❌ Export functionality
- ❌ Invoice generation logic
- ❌ Recurring bookings
- ❌ Subscription models

#### 6. Infrastructure (0%)
- ❌ Railway backend deployment
- ❌ Vercel frontend deployment
- ❌ Cloudflare DNS/CDN setup
- ❌ Automated backups
- ❌ Environment variable configuration in production

---

## Phase-wise Completion

### Phase 1: Foundation (Months 1-2) — 78% Complete ← IMPROVED
| Week | Deliverable | Status |
|------|------------|--------|
| 1 | Repo setup, Supabase project, migrations | ✅ Done |
| 2 | Database schema, auth integration, basic API | ✅ Done |
| 3 | Worker management (CRUD) | ✅ Done |
| 4 | Booking engine + state machine | ✅ Done |
| 5 | Matching engine (rule-based + ML blended) | ✅ Done |
| 6 | Settlement engine (manual payout) | ⚠️ Partial |
| 7 | Flutter worker app | ❌ Not started |
| 8 | Flutter customer app | ❌ Not started |
| 9 | Admin dashboard | ✅ Done |
| 10 | Pilot cooperative onboarding | ⚠️ Partial |
| 11 | Pilot institution onboarding (AMC) | ⚠️ Partial |
| 12 | First 50 test bookings | ❌ Not started |

**Phase 1: 6/12 fully done, 3 partial, 3 not started**

### Phase 2: Intelligence (Months 3-4) — 40% Complete ← MAJOR IMPROVEMENT
| Week | Deliverable | Status |
|------|------------|--------|
| 13-14 | Synthetic data generation | ✅ Done |
| 15-16 | HF Space setup + LightGBM | ⚠️ Code done, not deployed |
| 17-18 | Demand forecast API + federation dashboard | ⚠️ API done, UI partial |
| 19-20 | ILP allocation via OR-Tools | ⚠️ Heuristic done, OR-Tools deferred |
| 21-22 | Forecast evaluation + A/B test setup | ⚠️ Evaluation script done |
| 23-24 | Skill gap detection + automated alerts | ❌ Not started |

**Phase 2: 1/6 fully done, 4 partial, 1 not started**

### Phase 3: Growth (Months 5-6) — 35% Complete
| Week | Deliverable | Status |
|------|------------|--------|
| 25-26 | Cancellation prediction | ❌ Not started |
| 27-28 | Welfare dashboard + claims | ⚠️ Partial |
| 29-30 | Federation dashboard | ⚠️ Partial |
| 31-32 | Performance optimization | ❌ Not started |
| 33-34 | Load testing | ❌ Not started |
| 35-36 | Documentation | ⚠️ Partial (PRD + IMPLEMENTATION_STATUS) |

**Phase 3: 0/6 fully done, 3 partial, 3 not started**

---

## PRD Feature Checklist

### Core Platform
| Feature | PRD Requirement | Implementation | Notes |
|---------|----------------|----------------|-------|
| **Auth** | Phone OTP via Supabase | 85% | Scaffolded, not tested end-to-end |
| **Worker profiles** | CRUD, skills, rating, trust score | 85% | Trust score formula not in code |
| **Customer profiles** | household/institution types | 80% | Basic CRUD, GSTIN not used |
| **Booking engine** | Full lifecycle + state machine | 80% | All states implemented, GPS arrival partial |
| **Matching** | Rule-based + ILP | 85% | Rule-based done, ML-blended added, ILP deferred |
| **Payments** | Razorpay integration | 70% | API ready, test mode not configured |
| **Settlements** | Multi-party split | 60% | API exists, auto-calculation not implemented |
| **Reviews** | Post-booking ratings | 70% | API done, UI partial |
| **Complaints** | Dispute system | 70% | Full CRUD + conversation thread |

### Advanced Features
| Feature | PRD Requirement | Implementation | Notes |
|---------|----------------|----------------|-------|
| **Welfare** | Worker welfare accounts + claims | 60% | Claims API done, balance tracking partial |
| **Federations** | Regional federation management | 60% | CRUD done, analytics partial |
| **AMC Contracts** | Institutional maintenance contracts | 50% | Table + API done, UI placeholder |
| **Demand Forecast** | ML-based job prediction | 70% | Pipeline built, model not trained, HF not deployed |
| **Service Catalog** | Managed service catalog | 55% | Table + API done, categories partial |
| **Worker Allocation** | ILP solver | 75% | Heuristic done, OR-Tools deferred |
| **Trust Score** | Weighted formula | 40% | Formula in PRD, not implemented in code |
| **Cancellation Prediction** | ML model | 0% | Not started |
| **Fraud Detection** | Isolation Forest | 0% | Not started |

### Infrastructure
| Component | PRD Requirement | Implementation | Notes |
|-----------|----------------|----------------|-------|
| **Database** | Supabase PostgreSQL + PostGIS | 95% | 14 migrations, all tables created |
| **Backend** | Railway (Node.js monolith) | 0% | Not deployed |
| **Frontend** | Vercel (Next.js) | 0% | Not deployed |
| **ML Hosting** | HuggingFace Space | 75% | Code ready, not deployed |
| **Auth** | Supabase Auth | 85% | Integrated, not tested in production |
| **Storage** | Supabase Storage | 0% | Buckets not configured |
| **CI/CD** | GitHub Actions | 0% | No workflows |
| **Monitoring** | Sentry + Axiom + UptimeRobot | 0% | Not configured |
| **SMS** | MSG91 | 0% | Not integrated |
| **Email** | Resend | 0% | Not integrated |
| **Maps** | Google Distance Matrix | 0% | Not integrated |
| **Weather** | OpenWeatherMap | 0% | Not integrated |

### Mobile Apps
| Component | PRD Requirement | Implementation |
|-----------|----------------|----------------|
| **Flutter Worker App** | Login, jobs, complete, GPS | 0% |
| **Flutter Customer App** | Book, track, pay | 0% |
| **Offline-first** | Hive + sync queue | 0% |
| **Push Notifications** | FCM | 0% |

---

## Critical Gaps (Blocking Production)

### Must-Have Before Pilot Launch
1. **Flutter Mobile Apps** — PRD requires worker + customer apps (0%)
2. **Razorpay Test Mode** — End-to-end payment flow not tested
3. **SMS Notifications** — Critical for worker job assignments
4. **CI/CD Pipeline** — No automated deployment
5. **Monitoring & Alerts** — No production observability
6. **Testing Framework** — Zero tests written
7. **Model Training** — ML pipeline code exists but no trained model
8. **HF Space Deployment** — ML API not live

### Can Defer to Post-Pilot
1. ILP allocation (rule-based matching works for MVP)
2. Cancellation prediction
3. Fraud detection
4. Advanced analytics
5. Invoice generation
6. Subscription models

---

## Progress Summary by Layer

| Layer | Completion | Notes |
|-------|-----------|-------|
| **Database** | 95% | All tables, migrations, indexes done |
| **Backend API** | 78% | 25 routes, services, repositories |
| **Frontend (Web)** | 65% | Pages exist, many use placeholder data |
| **ML Pipeline** | 75% | Code complete, not deployed/trained |
| **Mobile (Flutter)** | 0% | Not started |
| **CI/CD** | 0% | Not started |
| **Testing** | 0% | Not started |
| **Integrations** | 10% | APIs ready, not configured |
| **Monitoring** | 0% | Not started |
| **Infrastructure** | 0% | Not deployed anywhere |

**Overall: ~72%** (up from ~60-65% in previous assessment)

---

## What Changed Since Last Assessment

### Improvements
1. ✅ **ML Pipeline** — Complete training/inference/evaluation code added
2. ✅ **ML Wiring** — Matching API now calls ML service with fallback
3. ✅ **Forecast API** — New route persisting predictions to DB
4. ✅ **Allocation API** — New route for worker-job assignment
5. ✅ **Admin Navigation** — Added Federations + AMC links
6. ✅ **Synthetic Data** — Generator script for cold-start ML training

### Still Missing
1. ❌ Trained ML model (no `.pkl` file)
2. ❌ HuggingFace Space deployment
3. ❌ Flutter apps
4. ❌ CI/CD
5. ❌ Testing
6. ❌ Production deployments

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|---------|-----------|
| Flutter apps not started | 🔴 High | 0% — blocks mobile-first PRD requirement |
| No testing framework | 🔴 High | Add smoke tests before pilot |
| ML not deployed | 🟠 Medium-High | Code ready, needs training + HF deployment |
| No CI/CD | 🟠 Medium-High | Manual deployment possible but risky |
| SMS not integrated | 🟠 Medium-High | Critical for worker notifications |
| Razorpay not configured | 🟠 Medium | Test mode needed for pilot |
| Monitoring not set up | 🟡 Medium | Add before production |
| RLS policies incomplete | 🟡 Medium | Complete before real data |

---

## Recommendations

### Immediate (Week 1-2)
1. Train ML model: `python ml/train_demand_forecast.py`
2. Deploy HF Space with trained model
3. Configure Razorpay test mode
4. Set up MSG91 for SMS
5. Add basic CI/CD (GitHub Actions for tests + deploy)

### Short-term (Week 3-6)
1. Build Flutter worker app (MVP: login, jobs, complete)
2. Build Flutter customer app (MVP: book, track, pay)
3. Implement automated settlement calculation
4. Add unit tests for critical paths
5. Deploy to Railway + Vercel

### Medium-term (Month 2-3)
1. ML model evaluation with real data
2. Trust score formula implementation
3. Federation analytics dashboard
4. Invoice generation
5. Performance optimization

### Long-term (Month 3-6)
1. ILP allocation with OR-Tools
2. Cancellation prediction
3. Fraud detection
4. Skill gap detection
5. Scale preparation

---

## Bottom Line

**Strengths:**
- Solid database schema with all PRD tables
- 25 API routes covering core features
- Complete ML pipeline code (training, inference, evaluation)
- Good separation of concerns (services, repositories, domain logic)
- Admin dashboard with multiple modules
- Type-safe TypeScript with 0 compilation errors

**Weaknesses:**
- No mobile apps (Flutter) — 0% complete
- No CI/CD or testing
- ML code exists but not deployed or trained
- Missing critical integrations (Razorpay, SMS, Maps)
- Feature directories mostly empty (APIs exist, UI components missing)

**Overall:** Backend API is ~78% complete. ML pipeline is ~75% complete (code done, not deployed). Frontend web is ~65% complete. Mobile apps are 0%. **Ready for internal API testing, not production pilot.**

**Estimated time to production-ready:** 6-8 weeks with focused effort on mobile apps, integrations, testing, and deployment.

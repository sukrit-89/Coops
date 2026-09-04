# CooperativeConnect (Coops)

> **The Digital Service Marketplace for Skilled Labor Cooperative Workers**

CooperativeConnect is a production-grade digital marketplace platform connecting local customers with verified skilled workers associated with formal labor cooperatives. The system digitizes discovery, multi-criteria worker matching, service booking, real-time in-app communication, digital payments, itemized invoices, grievance resolution, multilingual localization, and administrative governance.

---

## Technical Architecture & System Flow

```
                                  [ Client Application ]
                            Next.js 16 (App Router) + React 19
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
[ Next.js Middleware ]           [ i18n Context Provider ]         [ API Routes & Actions ]
(Cookie Session Refresh)         (English, Hindi, Bengali)            (Zod Validation)
         │                                 │                                 │
         └─────────────────────────────────┼─────────────────────────────────┘
                                           │
                                           ▼
                 ┌──────────────────────────────────────────────────┐
                 │      Supabase BaaS / PostgreSQL 15 Engine        │
                 ├──────────────────────────────────────────────────┤
                 │ • Supabase SSR Auth Session Management           │
                 │ • PostgreSQL Row Level Security (RLS) Policies   │
                 │ • Realtime Channels (CDC WebSockets for Chat)    │
                 │ • Stored Procedures & Triggers (PL/pgSQL)       │
                 └──────────────────────────────────────────────────┘
                                           │
                                           ▼ (Optional HTTP Proxy)
                 ┌──────────────────────────────────────────────────┐
                 │      Python AI/ML Worker Recommendation Engine   │
                 ├──────────────────────────────────────────────────┤
                 │ • FastAPI / Uvicorn REST Endpoint                │
                 │ • Scikit-learn (RandomForestClassifier)          │
                 │ • Pydantic v2 & Joblib Model Serialization       │
                 └──────────────────────────────────────────────────┘
```

---

## Complete Technology Stack

| Domain | Technology / Package | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Full-stack React framework with Turbopack, SSR, and Server Components |
| **UI Library** | **React 19** | Modern UI rendering library with Server Actions & Hooks |
| **Language** | **TypeScript 5.x** | Strict static typing, DB schema interfaces (`types/database.ts`) |
| **Styling** | **Tailwind CSS v4 & Vanilla CSS Tokens** | Utility-first styling with custom HSL theme tokens (`globals.css`) |
| **Typography** | **Google Fonts** | Inter and Instrument Serif web fonts |
| **Iconography** | **Lucide React** | Scalable SVG icons (`LocateFixed`, `Search`, `Star`, `User`, `X`, etc.) |
| **Authentication** | **Supabase Auth (`@supabase/ssr`)** | SSR Cookie Auth session persistence and middleware automatic token refresh |
| **Database** | **PostgreSQL 15 (Supabase)** | Relational Database with 12 ordered SQL migrations, views, & triggers |
| **Database Security** | **PostgreSQL RLS** | Granular SQL row-level policies enforcing user and role read/write boundaries |
| **Real-time Engine** | **Supabase Realtime** | WebSocket CDC channels for real-time chat messages and notifications |
| **AI / ML Service** | **Python 3.11+, FastAPI** | Machine Learning REST service for candidate scoring (`ml/service.py`) |
| **Machine Learning** | **Scikit-learn** | `RandomForestClassifier` with balanced class weights for ranking candidates |
| **Data Validation** | **Zod (TS) & Pydantic v2 (Python)** | Schema validation for HTTP payloads, forms, and API route boundaries |
| **Model Serialization**| **Joblib** | Serialization and deserialization of `.joblib` model binary weights |
| **Localization (i18n)**| **Custom React Context** | Multilingual engine supporting English (`en`), Hindi (`hi`), Bengali (`bn`) |
| **Payments Boundary** | **Razorpay Integration Boundary** | HMAC SHA256 Webhook verification, payment orders, & itemized invoice receipts |
| **Geolocation** | **HTML5 Geolocation API & Haversine** | Browser GPS location capture and mathematical distance calculation (`distanceInKm`) |
| **Testing** | **Vitest 3.x** | Unit testing framework for candidate scoring algorithms and domain state transitions |

---

## Features & Implementation Status

| Feature Module | Description | Status | Key Module Files |
| :--- | :--- | :--- | :--- |
| **Auth & Sessions** | Email/password sign-up, sign-in, sign-out, session refresh middleware | **Complete** | [middleware.ts](file:///home/sukrit/Projects/COOP/src/middleware.ts), [auth-form.tsx](file:///home/sukrit/Projects/COOP/src/features/auth/auth-form.tsx), [sign-out/route.ts](file:///home/sukrit/Projects/COOP/src/app/api/sign-out/route.ts) |
| **Role-Based Access** | Granular permissions for `customer`, `worker`, `cooperative_admin`, `platform_admin` | **Complete** | [server.ts](file:///home/sukrit/Projects/COOP/src/lib/auth/server.ts), [admin/users/page.tsx](file:///home/sukrit/Projects/COOP/src/app/admin/users/page.tsx) |
| **Worker Discovery** | Multi-attribute search (query, category, city, GPS distance, rating, experience) | **Complete** | [search-form.tsx](file:///home/sukrit/Projects/COOP/src/features/discovery/search-form.tsx), [services/page.tsx](file:///home/sukrit/Projects/COOP/src/app/services/page.tsx) |
| **AI Smart Matching** | Weighted candidate scoring (Skill 30%, Distance 20%, Availability 20%, Rating 15%, Experience 10%) | **Complete** | [matching.ts](file:///home/sukrit/Projects/COOP/src/lib/domain/matching.ts), [api/matching/route.ts](file:///home/sukrit/Projects/COOP/src/app/api/matching/route.ts) |
| **Booking Lifecycle** | State machine (Requested → Accepted → Confirmed → En Route → In Progress → Completed) | **Complete** | [booking-status.ts](file:///home/sukrit/Projects/COOP/src/lib/domain/booking-status.ts), [status-action.tsx](file:///home/sukrit/Projects/COOP/src/features/bookings/status-action.tsx) |
| **Real-time Chat** | In-app messaging panel with Supabase Realtime channel subscription | **Complete** | [conversation-panel.tsx](file:///home/sukrit/Projects/COOP/src/features/communication/conversation-panel.tsx) |
| **Payments & Invoices**| Payment records, null-safe accounting, itemized PDF receipts with 5% platform fee | **Complete** | [payments/page.tsx](file:///home/sukrit/Projects/COOP/src/app/payments/page.tsx), [invoices/page.tsx](file:///home/sukrit/Projects/COOP/src/app/invoices/page.tsx) |
| **Reviews & Ratings** | Post-service star rating (1-5) and feedback submission | **Complete** | [review-form.tsx](file:///home/sukrit/Projects/COOP/src/features/bookings/review-form.tsx) |
| **Dispute Resolution** | Customer complaint submission and administrative status management | **Complete** | [complaint-form.tsx](file:///home/sukrit/Projects/COOP/src/features/communication/complaint-form.tsx), [admin/complaints/page.tsx](file:///home/sukrit/Projects/COOP/src/app/admin/complaints/page.tsx) |
| **Analytics Dashboard**| Live KPI metric cards, demand trends, category breakdown, top workers summary | **Complete** | [analytics-data.ts](file:///home/sukrit/Projects/COOP/src/features/dashboard/analytics-data.ts), [analytics/page.tsx](file:///home/sukrit/Projects/COOP/src/app/analytics/page.tsx) |
| **Multilingual i18n** | React Context provider supporting English, Hindi, Bengali with Navbar switcher | **Complete** | [context.tsx](file:///home/sukrit/Projects/COOP/src/lib/i18n/context.tsx), [navbar.tsx](file:///home/sukrit/Projects/COOP/src/components/layout/navbar.tsx) |
| **Admin Panel** | Comprehensive platform management hub for users, services, bookings, payments, and complaints | **Complete** | [admin/page.tsx](file:///home/sukrit/Projects/COOP/src/app/admin/page.tsx) |

---

## Application Route Map

| Route Path | Description | Required Authorization |
| :--- | :--- | :--- |
| `/` | Landing page highlighting Coops ecosystem | Public |
| `/services` | Service catalog, worker search, and discovery filters | Public |
| `/workers/[workerId]` | Worker public profile & direct booking request form | Public / Authenticated |
| `/auth` | Role-aware user sign-in and account creation form | Public |
| `/bookings` | Customer service history & worker task queue | Authenticated |
| `/dashboard` | Role-customized operational metrics & quick links | Authenticated |
| `/payments` | Personal payment transaction records and total volume | Authenticated |
| `/invoices` | Itemized digital invoice receipts with platform fee breakdown | Authenticated |
| `/analytics` | Platform demand trends, category breakdown, & top workers | Admin (`platform_admin` / `cooperative_admin`) |
| `/admin` | Administration hub with navigation to all sub-modules | Admin (`platform_admin`) |
| `/admin/users` | Manage user profiles and update authorization roles | Admin (`platform_admin`) |
| `/admin/services` | Service catalog management & new service creation | Admin (`platform_admin`) |
| `/admin/bookings` | Global bookings monitor across all cooperatives | Admin (`platform_admin`) |
| `/admin/payments` | Financial audit table and payment status tracking | Admin (`platform_admin`) |
| `/admin/complaints` | Customer dispute resolution & investigation log notes | Admin (`platform_admin` / `cooperative_admin`) |
| `/onboarding/worker` | Submit new worker registration application | Authenticated |
| `/operations/verification` | Review and verify pending worker applications | Admin (`platform_admin` / `cooperative_admin`) |
| `/profile/worker` | Edit worker skills, availability, and settings | Worker role |

---

## Getting Started

### Prerequisites
* **Node.js**: v18.0 or newer
* **npm**: v9.0 or newer
* **Supabase Project**: Account and project created at [supabase.com](https://supabase.com)
* **Python** *(Optional for ML)*: v3.10+ with `pip`

### Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional external integrations
ML_SERVICE_URL=http://localhost:5000
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
GOOGLE_MAPS_API_KEY=your-maps-key
```

### Database Migration & Seed Instructions

Execute all 12 migrations in `supabase/migrations/` sequentially in your Supabase SQL Editor:

1. `0001_initial_schema.sql` — Core tables, enums, initial RLS
2. `0002_auth_profile_bootstrap.sql` — Automatic profile provisioning
3. `0003_worker_applications.sql` — Worker application workflows
4. `0004_booking_history_permissions.sql` — Audit log RLS policies
5. `0005_booking_notifications.sql` — Notifications schema
6. `0006_security_and_worker_provisioning.sql` — Approval stored procedure
7. `0007_transactional_booking_api.sql` — Transactional booking request RPC
8. `0008_write_boundary_hardening.sql` — RLS write boundary hardening
9. `0009_complaints_chat_permissions.sql` — Communication & dispute tables
10. `0010_payment_idempotency_and_complaint_security.sql` — Financial integrity
11. `0011_notification_triggers.sql` — Automated database triggers
12. `0012_atomic_worker_settings.sql` — Atomic worker settings RPC

Run `supabase/seed.sql` to populate initial service categories (Electrical, Plumbing, Carpentry, Cleaning, Painting, Maintenance, Repair, Domestic Services) and sample service offerings.

---

## Running the Application

### 1. Development Mode
Start the Next.js development server:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Python ML Recommendation Engine *(Optional)*
In a separate terminal, navigate to the `ml/` directory, set up a virtual environment, install requirements, and run the Uvicorn server:

```bash
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install uvicorn fastapi scikit-learn pydantic joblib
uvicorn service:app --port 5000 --reload
```

### 3. Production Build & Execution

```bash
# Verify TypeScript types
npm run typecheck

# Run unit tests
npm test

# Build production bundle
npm run build

# Start production server
npm run start
```

---

## Quality Checks & Commands

```bash
npm run typecheck  # Executes strict tsc --noEmit check
npm test           # Executes Vitest test suite
npm run build      # Executes Next.js production build
```

---

## Repository Structure

```text
/
├── ml/                       Python Machine Learning FastAPI recommendation service
│   ├── service.py            FastAPI endpoints (/predict, /train) and RandomForest logic
│   └── worker_match_model.joblib Model binary weights
├── src/
│   ├── app/                  Next.js 16 App Router pages and API routes
│   │   ├── admin/            Platform administration sub-routes (users, services, etc.)
│   │   ├── analytics/        Platform analytics and KPI dashboard
│   │   ├── api/              Server API route handlers (sign-out, matching, admin, etc.)
│   │   ├── bookings/         Customer history & worker task queue page
│   │   ├── dashboard/        Role-customized dashboard page
│   │   ├── invoices/         Itemized receipt download page
│   │   ├── payments/         Payment history & verified volume page
│   │   ├── services/         Service discovery search & filter page
│   │   ├── error.tsx         Global application error boundary
│   │   ├── loading.tsx       Global route transition loader
│   │   ├── layout.tsx        Root layout wrapped with i18n LocaleProvider
│   │   └── middleware.ts     Supabase auth session refresh middleware
│   ├── components/           Shared UI components (Navbar, PageShell, State views)
│   ├── features/             Domain features (auth, discovery, bookings, analytics)
│   ├── lib/                  Supabase clients, auth helpers, domain algorithms, i18n
│   └── types/                Database TypeScript definitions
├── supabase/
│   ├── migrations/           Ordered SQL migrations (0001 to 0012)
│   └── seed.sql              Service category seed data
├── PRD.md                    Original Product Requirements Document & Status Matrix
├── PRD_IMPLEMENTATION_STATUS.md Full technical implementation status specification
└── package.json              Project dependencies and scripts
```

---

## Security Model

* **Authentication Boundary**: All auth interactions use `@supabase/ssr` with cookie storage and automatic session refresh via `src/middleware.ts`.
* **Row-Level Security (RLS)**: PostgreSQL tables strictly restrict data mutations based on authenticated user IDs and verified roles.
* **Server Guarding**: Privileged routes and APIs (`/admin/*`, `/analytics`, `/api/admin/*`) enforce server-side role validation using `requireRole()`.
* **Sanitized Inputs**: All user inputs undergo schema validation using `Zod` before database interaction.

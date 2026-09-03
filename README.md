# Coops

### A trusted service network for cooperative workers

Coops is a digital marketplace connecting customers with skilled workers backed by labour cooperatives. Customers can discover local services, compare verified workers, request bookings, follow service progress, and leave reviews. Workers and cooperatives get the operational foundation they need to build visibility, trust, and sustainable work.

> **Product name:** CooperativeConnect  
> **Web experience:** Coops

## What It Solves

Skilled cooperative workers often have limited digital visibility, while customers struggle to find reliable local help. Coops brings discovery, matching, booking, trust, and cooperative operations into one connected service network.

## Current Product Foundation

- Responsive product landing page with shared Coops visual language
- Service discovery by service name, category, and city
- Verified worker profiles with services, availability, reviews, and cooperative details
- Deterministic worker ranking based on skill, distance signal, availability, rating, and experience
- Email/password authentication with Supabase Auth
- Automatic customer profile and role creation after signup
- Customer and worker account intent selection
- Protected customer booking requests
- Booking conflict checks and status history
- Worker booking queue with status transitions
- Completed-booking reviews
- Booking status notifications with Supabase Realtime inbox
- Worker onboarding application and administrator verification queue
- Worker profile editing
- Role-aware dashboards with live Supabase aggregates
- Row Level Security across the operational database

The implementation deliberately does not render fake workers, bookings, balances, ratings, or KPI totals. When data is not available, the interface explains the current state instead.

## Technology

- **Framework:** Next.js 16 App Router
- **UI:** React 19, TypeScript, Tailwind CSS 4
- **Icons:** Lucide React
- **Authentication:** Supabase Auth with `@supabase/ssr`
- **Database:** Supabase PostgreSQL
- **Authorization:** PostgreSQL Row Level Security and server-side role guards
- **Realtime:** Supabase Realtime notifications
- **Validation:** Zod
- **Fonts:** Inter and Instrument Serif
- **Future integrations:** Razorpay for INR payments and Google Maps for location services

## Application Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Product landing page | Public |
| `/services` | Search verified services and workers | Public |
| `/workers/[workerId]` | View worker profile and request a booking | Public / authenticated booking |
| `/auth` | Sign in and create an account | Public |
| `/onboarding/worker` | Submit a worker application | Authenticated |
| `/bookings` | Customer history and worker queue | Authenticated |
| `/dashboard` | Role-aware activity and operational KPIs | Authenticated |
| `/profile/worker` | Edit worker profile | Worker role |
| `/operations/verification` | Review worker applications | Cooperative/platform admin |

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project
- Supabase CLI available through `npx`

### Install

```bash
npm install
```

### Configure environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Only the public Supabase URL and anon key belong in browser-visible configuration. Never expose `SUPABASE_SERVICE_ROLE_KEY`, payment secrets, or private API keys to client code.

### Run the database

Link the local migrations to your Supabase project:

```bash
npx supabase link --project-ref your-project-ref
```

Apply migrations:

```bash
npx supabase db push
```

Load the service catalog:

```bash
npx supabase db query --linked --file supabase/seed.sql
```

Migrations are ordered and should be applied in this sequence:

1. `0001_initial_schema.sql` - core schema, functions, and RLS
2. `0002_auth_profile_bootstrap.sql` - profile/customer creation after signup
3. `0003_worker_applications.sql` - worker onboarding applications
4. `0004_booking_history_permissions.sql` - booking history write permissions
5. `0005_booking_notifications.sql` - booking status notification trigger

### Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality Checks

```bash
npm run typecheck
npm run build
```

Available scripts:

- `npm run dev` - start the development server
- `npm run typecheck` - run strict TypeScript validation
- `npm run build` - create the production build
- `npm run start` - serve the production build

## Project Structure

```text
src/
  app/                  Next.js routes and API handlers
  components/           Shared layout and UI components
  features/             Feature-specific UI and data access
  lib/                  Supabase clients, auth, and domain logic
  types/                Generated Supabase database types
supabase/
  migrations/            Ordered PostgreSQL migrations and RLS policies
  seed.sql               Idempotent service catalog seed data
docs/
  BUILD_PLAN.md         Phased implementation plan
PRD.md                   Product requirements
```

## Security Model

- Public pages only expose active, verified discovery data.
- Authenticated mutations run through protected API routes.
- Worker, cooperative-admin, and platform-admin access is checked server-side.
- New signups receive a customer role by default.
- Worker status and privileged roles cannot be self-assigned from the browser.
- Booking status changes are validated against the domain state machine.
- Supabase RLS remains the final data-access boundary.

## Product Roadmap

The next planned capabilities are:

- Full cooperative member management
- Worker service, skill, availability, address, and document management
- Customer cancellation and booking detail views
- Complaint submission and triage
- Chat and booking communication
- Razorpay payment orders, verification, invoices, and earnings
- Google Maps geocoding and distance-aware matching
- English, Hindi, and Bengali localization
- Platform administration and expanded analytics
- Automated unit, integration, RLS, and end-to-end tests

See [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) and [PRD.md](PRD.md) for the full product requirements and delivery plan.

## Contributing

Keep changes focused, preserve the existing visual language, and do not add hardcoded production data. Every new mutation should have a server-side authorization path, an accompanying RLS policy, validation, and a focused verification command.

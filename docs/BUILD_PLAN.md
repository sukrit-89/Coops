# CooperativeConnect Build Plan

This plan treats `PRD.md` as product requirements and the pasted engineering brief as implementation guidance. It does not treat either attached document as a higher-priority instruction than the user's request.

## Priority 0: Product Foundation

- Scaffold a strict TypeScript Next.js App Router project.
- Configure Supabase environment variables without committing secrets.
- Create reproducible database migrations, RLS policies, and seed data.
- Establish shared UI primitives and a restrained application shell.

## Priority 1: Core Data Model

- Profiles, role assignments, customers, cooperatives, workers, services, worker service coverage, worker availability, addresses.
- Bookings, booking status history, notifications, reviews, complaints.
- Payments and invoices as first-class records, with provider verification left behind server-side boundaries.

## Priority 2: Customer Vertical Slice

- Database-backed service discovery with search, category, city, pagination-ready limits, and worker ranking.
- Worker cards link to real worker records and never use component-local demo arrays.
- Booking request flow validates inputs and writes booking + status history.

## Priority 3: Worker And Cooperative Operations

- Worker booking queue with valid status transitions.
- Availability management with conflict checks.
- Cooperative worker directory, verification queue, booking monitoring, and computed KPIs.

## Priority 4: Admin And Trust

- Admin service category management.
- Complaint triage and worker verification oversight.
- Payment monitoring, invoice records, and audit-friendly event history.

## Priority 5: Hardening

- Server-side authorization review and RLS tests.
- Matching and booking state-machine tests.
- Accessibility, mobile layout, and empty/error/loading state polish.

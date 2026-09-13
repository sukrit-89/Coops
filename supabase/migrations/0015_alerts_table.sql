-- Migration 0015: Add alerts table for automated threshold-based alerts

create table public.alerts (
 id uuid primary key default gen_random_uuid(),
 rule_id text not null,
 severity text not null check (severity in ('warning','critical')),
 message text not null,
 triggered_at timestamptz not null default now(),
 acknowledged_at timestamptz
);

create index alerts_triggered_at_idx on public.alerts (triggered_at desc);

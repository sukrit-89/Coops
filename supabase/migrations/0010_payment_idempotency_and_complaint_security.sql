drop policy if exists "complaint submitter update" on public.complaints;

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_name text not null,
  received_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create index payment_webhook_events_received_idx on public.payment_webhook_events (received_at desc);

alter table public.payment_webhook_events enable row level security;

create unique index payments_one_per_booking_idx on public.payments (booking_id);

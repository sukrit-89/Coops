-- Migration 0013: Add missing PRD tables — federation, settlement, welfare, contracts, forecasts, audit log

-- Federation table
create table public.federations (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 region text not null,
 admin_id uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create trigger federations_updated_at before update on public.federations
 for each row execute function public.set_updated_at();

-- Add federation_id to cooperatives
alter table public.cooperatives add column if not exists federation_id uuid references public.federations(id) on delete set null;
create index cooperatives_federation_idx on public.cooperatives (federation_id);

-- Settlement table
create table public.settlements (
 id uuid primary key default gen_random_uuid(),
 period_start date not null,
 period_end date not null,
 recipient_type text not null check (recipient_type in ('worker','cooperative','federation','welfare')),
 recipient_id uuid not null,
 amount_cents integer not null check (amount_cents >= 0),
 payout_status text not null default 'pending' check (payout_status in ('pending','processing','paid','failed')),
 payout_ref text,
 paid_at timestamptz,
 created_at timestamptz not null default now()
);
create index settlements_recipient_idx on public.settlements (recipient_id, recipient_type, period_end);

-- Welfare account table
create table public.welfare_accounts (
 worker_id uuid primary key references public.workers(profile_id) on delete cascade,
 balance_cents integer not null default 0 check (balance_cents >= 0),
 total_contributions_cents integer not null default 0 check (total_contributions_cents >= 0),
 total_claims_cents integer not null default 0 check (total_claims_cents >= 0),
 last_updated timestamptz not null default now()
);

-- Welfare claim table
create table public.welfare_claims (
 id uuid primary key default gen_random_uuid(),
 worker_id uuid not null references public.workers(profile_id) on delete cascade,
 amount_cents integer not null check (amount_cents > 0),
 reason text not null,
 status text not null default 'pending' check (status in ('pending','approved','rejected','paid')),
 reviewed_by uuid references public.profiles(id) on delete set null,
 reviewed_at timestamptz,
 paid_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index welfare_claims_worker_idx on public.welfare_claims (worker_id, status, created_at desc);

create trigger welfare_claims_updated_at before update on public.welfare_claims
 for each row execute function public.set_updated_at();

-- Demand forecast table
create table public.demand_forecasts (
 id uuid primary key default gen_random_uuid(),
 service_id uuid not null references public.services(id) on delete cascade,
 zone text not null,
 forecast_date date not null,
 predicted_jobs numeric not null check (predicted_jobs >= 0),
 confidence_low numeric check (confidence_low >= 0),
 confidence_high numeric check (confidence_high >= 0),
 model_version text,
 created_at timestamptz not null default now()
);
create index demand_forecasts_lookup_idx on public.demand_forecasts (service_id, zone, forecast_date);

-- AMC contract table
create table public.amc_contracts (
 id uuid primary key default gen_random_uuid(),
 institution_id uuid not null references public.customers(profile_id) on delete cascade,
 cooperative_id uuid not null references public.cooperatives(id) on delete restrict,
 start_date date not null,
 end_date date not null,
 total_visits_per_month integer not null check (total_visits_per_month > 0),
 service_ids uuid[] not null default '{}',
 sla_response_hours integer not null default 24 check (sla_response_hours > 0),
 status text not null default 'active' check (status in ('active','suspended','expired','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (end_date > start_date)
);
create index amc_contracts_coop_idx on public.amc_contracts (cooperative_id, status);
create index amc_contracts_institution_idx on public.amc_contracts (institution_id);

create trigger amc_contracts_updated_at before update on public.amc_contracts
 for each row execute function public.set_updated_at();

-- Audit log table
create table public.audit_log (
 id bigserial primary key,
 actor_id uuid references public.profiles(id) on delete set null,
 action text not null,
 resource_type text,
 resource_id uuid,
 metadata jsonb not null default '{}'::jsonb,
 ip_address inet,
 created_at timestamptz not null default now()
);
create index audit_log_actor_idx on public.audit_log (actor_id);
create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_resource_idx on public.audit_log (resource_type, resource_id);

-- Service catalog items table
create table if not exists public.service_catalog_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Price fields in cents (the existing schema uses cents, but the PRD also expects rupees)
-- Add rupees-based price columns to bookings for display convenience
alter table public.bookings add column if not exists final_price_cents integer check (final_price_cents is null or final_price_cents >= 0);

-- Add notification type column used by migration 0011 triggers
alter table public.notifications add column if not exists type text;

-- RLS
alter table public.federations enable row level security;
alter table public.settlements enable row level security;
alter table public.welfare_accounts enable row level security;
alter table public.welfare_claims enable row level security;
alter table public.demand_forecasts enable row level security;
alter table public.amc_contracts enable row level security;
alter table public.audit_log enable row level security;
alter table public.service_catalog_items enable row level security;

create policy "catalog items public select" on public.service_catalog_items for select using (true);
create policy "catalog items admin manage" on public.service_catalog_items for all using (public.has_role('platform_admin')) with check (public.has_role('platform_admin'));

-- RLS policies: federations
create policy "platform admin manages federations" on public.federations
 for all using (public.has_role('platform_admin'))
 with check (public.has_role('platform_admin'));
create policy "fed admins view own federation" on public.federations
 for select using (
 public.has_role('platform_admin')
 or admin_id = auth.uid()
 or exists (
 select 1 from public.cooperatives c
 where c.federation_id = federations.id
 and public.is_cooperative_admin(c.id)
 )
 );

-- RLS policies: settlements
create policy "settlements admin view" on public.settlements
 for select using (public.has_role('platform_admin') or public.is_cooperative_admin(
 (select cooperative_id from public.workers where profile_id = settlements.recipient_id)
 ));
create policy "settlements admin manage" on public.settlements
 for all using (public.has_role('platform_admin'))
 with check (public.has_role('platform_admin'));

-- RLS policies: welfare_accounts
create policy "welfare account own view" on public.welfare_accounts
 for select using (worker_id = auth.uid() or public.has_role('platform_admin'));
create policy "welfare account admin manage" on public.welfare_accounts
 for all using (public.has_role('platform_admin'))
 with check (public.has_role('platform_admin'));

-- RLS policies: welfare_claims
create policy "welfare claims own or admin" on public.welfare_claims
 for select using (
 worker_id = auth.uid()
 or public.has_role('platform_admin')
 or exists (
 select 1 from public.workers w
 where w.profile_id = worker_id and public.is_cooperative_admin(w.cooperative_id)
 )
 );
create policy "welfare claims worker create" on public.welfare_claims
 for insert with check (worker_id = auth.uid());
create policy "welfare claims admin update" on public.welfare_claims
 for update using (public.has_role('platform_admin'))
 with check (public.has_role('platform_admin'));

-- RLS policies: demand_forecasts
create policy "demand forecasts admin view" on public.demand_forecasts
 for select using (
 public.has_role('platform_admin')
 or exists (
 select 1 from public.cooperatives c
 where c.federation_id = (
 select f.federation_id from public.cooperatives f where f.id = (
 select w.cooperative_id from public.workers w where w.profile_id = auth.uid()
 )
 )
 )
 );

-- RLS policies: amc_contracts
create policy "amc contracts participant view" on public.amc_contracts
 for select using (
 public.has_role('platform_admin')
 or exists (
 select 1 from public.cooperative_members cm
 where cm.cooperative_id = amc_contracts.cooperative_id
 and cm.profile_id = auth.uid()
 )
 or institution_id = auth.uid()
 );
create policy "amc contracts admin manage" on public.amc_contracts
 for all using (public.has_role('platform_admin'))
 with check (public.has_role('platform_admin'));

-- RLS policies: audit_log
create policy "audit log admin select" on public.audit_log
 for select using (public.has_role('platform_admin'));

-- Helper function: compute welfare balance
create or replace function public.compute_welfare_balance(p_worker_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
 total_contrib numeric;
 total_claims numeric;
begin
 select coalesce(sum(amount_cents), 0) into total_contrib
 from public.settlements
 where recipient_id = p_worker_id and recipient_type = 'welfare';

 select coalesce(sum(amount_cents), 0) into total_claims
 from public.welfare_claims
 where worker_id = p_worker_id and status in ('approved', 'paid');

 update public.welfare_accounts
 set
 total_contributions_cents = total_contrib,
 total_claims_cents = total_claims,
 balance_cents = greatest(0, total_contrib - total_claims),
 last_updated = now()
 where worker_id = p_worker_id;
end;
$$;
grant execute on function public.compute_welfare_balance(uuid) to authenticated;

-- Helper function: create settlement entries for a booking
create or replace function public.create_settlements_for_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
 booking_row public.bookings;
 platform_fee_cents integer;
 worker_earnings_cents integer;
 coop_earnings_cents integer;
 fed_earnings_cents integer;
 welfare_contrib_cents integer;
 amount numeric;
begin
 select * into booking_row from public.bookings where id = p_booking_id;
 if booking_row.id is null then
 raise exception 'Booking not found';
 end if;

 if booking_row.final_price_cents is not null then
 amount := booking_row.final_price_cents;
 elsif booking_row.quoted_price_cents is not null then
 amount := booking_row.quoted_price_cents;
 else
 return;
 end if;

 platform_fee_cents := greatest(0, round(amount * 0.05));
 worker_earnings_cents := greatest(0, round(amount * 0.70));
 coop_earnings_cents := greatest(0, round(amount * 0.15));
 fed_earnings_cents := greatest(0, round(amount * 0.05));
 welfare_contrib_cents := greatest(0, round(amount * 0.03));

 insert into public.settlements (recipient_type, recipient_id, amount_cents, payout_status)
 values
 ('worker', booking_row.worker_id, worker_earnings_cents, 'pending'),
 ('cooperative', booking_row.cooperative_id, coop_earnings_cents, 'pending'),
 ('welfare', booking_row.worker_id, welfare_contrib_cents, 'pending');

 if fed_earnings_cents > 0 then
 insert into public.settlements (recipient_type, recipient_id, amount_cents, payout_status)
 select 'federation', f.federation_id, fed_earnings_cents, 'pending'
 from public.cooperatives f where f.id = booking_row.cooperative_id and f.federation_id is not null;
 end if;

 perform public.compute_welfare_balance(booking_row.worker_id);
end;
$$;
grant execute on function public.create_settlements_for_booking(uuid) to authenticated;

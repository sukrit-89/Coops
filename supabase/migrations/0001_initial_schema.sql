create extension if not exists "pgcrypto";
create extension if not exists "cube" with schema public;
create extension if not exists "earthdistance" with schema public;

create type public.app_role as enum ('customer', 'worker', 'cooperative_admin', 'platform_admin');
create type public.verification_status as enum ('pending', 'verified', 'rejected', 'suspended');
create type public.booking_status as enum (
  'requested',
  'accepted',
  'confirmed',
  'worker_en_route',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'disputed'
);
create type public.payment_status as enum ('pending', 'processing', 'paid', 'failed', 'refunded');
create type public.complaint_status as enum ('open', 'under_review', 'resolved', 'rejected', 'escalated');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  preferred_language text not null default 'en',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_roles (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, role)
);

create table public.customers (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.cooperatives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration_number text not null unique,
  phone text,
  email text,
  status public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cooperative_members (
  cooperative_id uuid not null references public.cooperatives(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (cooperative_id, profile_id, role)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  cooperative_id uuid references public.cooperatives(id) on delete cascade,
  label text,
  line1 text not null,
  line2 text,
  city text not null,
  district text,
  state text not null,
  postal_code text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint address_owner_check check (
    (profile_id is not null and cooperative_id is null)
    or (profile_id is null and cooperative_id is not null)
  ),
  constraint address_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint address_longitude_check check (longitude is null or longitude between -180 and 180)
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workers (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  cooperative_id uuid not null references public.cooperatives(id) on delete restrict,
  bio text,
  years_experience integer not null default 0 check (years_experience >= 0),
  verification_status public.verification_status not null default 'pending',
  active boolean not null default true,
  service_radius_km integer not null default 10 check (service_radius_km > 0 and service_radius_km <= 150),
  completed_jobs integer not null default 0 check (completed_jobs >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.worker_services (
  worker_id uuid not null references public.workers(profile_id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  base_price_cents integer check (base_price_cents is null or base_price_cents >= 0),
  created_at timestamptz not null default now(),
  primary key (worker_id, service_id)
);

create table public.worker_skills (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(profile_id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (worker_id, name)
);

create table public.worker_availability (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(profile_id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint availability_time_check check (starts_at < ends_at)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(profile_id) on delete restrict,
  worker_id uuid not null references public.workers(profile_id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  address_id uuid not null references public.addresses(id) on delete restrict,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  status public.booking_status not null default 'requested',
  requirement text not null,
  quoted_price_cents integer check (quoted_price_cents is null or quoted_price_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_time_check check (scheduled_end is null or scheduled_start < scheduled_end)
);

create table public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  from_status public.booking_status,
  to_status public.booking_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  customer_id uuid not null references public.customers(profile_id) on delete restrict,
  worker_id uuid not null references public.workers(profile_id) on delete restrict,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'INR',
  provider text,
  provider_reference text,
  status public.payment_status not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  payment_id uuid references public.payments(id) on delete set null,
  invoice_number text not null unique,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  issued_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  customer_id uuid not null references public.customers(profile_id) on delete restrict,
  worker_id uuid not null references public.workers(profile_id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete set null,
  status public.complaint_status not null default 'open',
  subject text not null,
  body text not null,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.worker_documents (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(profile_id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.favorites (
  customer_id uuid not null references public.customers(profile_id) on delete cascade,
  worker_id uuid not null references public.workers(profile_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, worker_id)
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  entity_type text,
  entity_id uuid,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_full_name_idx on public.profiles using gin (to_tsvector('simple', full_name));
create index addresses_city_state_idx on public.addresses (city, state);
create index addresses_geo_idx on public.addresses (latitude, longitude);
create index services_category_idx on public.services (category_id, is_active);
create index workers_cooperative_idx on public.workers (cooperative_id, verification_status, active);
create index worker_services_service_idx on public.worker_services (service_id);
create index worker_availability_worker_day_idx on public.worker_availability (worker_id, day_of_week, is_active);
create index bookings_customer_status_idx on public.bookings (customer_id, status, scheduled_start desc);
create index bookings_worker_status_idx on public.bookings (worker_id, status, scheduled_start desc);
create index bookings_service_start_idx on public.bookings (service_id, scheduled_start);
create index payments_booking_status_idx on public.payments (booking_id, status);
create index complaints_status_created_idx on public.complaints (status, created_at desc);
create index notifications_recipient_read_idx on public.notifications (recipient_id, read_at, created_at desc);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index analytics_events_name_created_idx on public.analytics_events (event_name, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger cooperatives_updated_at before update on public.cooperatives
  for each row execute function public.set_updated_at();
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();
create trigger service_categories_updated_at before update on public.service_categories
  for each row execute function public.set_updated_at();
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create trigger workers_updated_at before update on public.workers
  for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create trigger complaints_updated_at before update on public.complaints
  for each row execute function public.set_updated_at();

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profile_roles
    where profile_id = auth.uid()
      and role = required_role
  );
$$;

create or replace function public.is_cooperative_admin(target_cooperative_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.cooperative_members
    where profile_id = auth.uid()
      and cooperative_id = target_cooperative_id
      and role = 'cooperative_admin'
  ) or public.has_role('platform_admin');
$$;

create or replace function public.worker_average_rating(target_worker_id uuid)
returns numeric
language sql
stable
as $$
  select coalesce(round(avg(rating)::numeric, 2), 0)
  from public.reviews
  where worker_id = target_worker_id;
$$;

alter table public.profiles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.customers enable row level security;
alter table public.cooperatives enable row level security;
alter table public.cooperative_members enable row level security;
alter table public.addresses enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.workers enable row level security;
alter table public.worker_services enable row level security;
alter table public.worker_skills enable row level security;
alter table public.worker_availability enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.reviews enable row level security;
alter table public.complaints enable row level security;
alter table public.notifications enable row level security;
alter table public.worker_documents enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.favorites enable row level security;
alter table public.analytics_events enable row level security;

create policy "profiles select own or admin" on public.profiles
  for select using (id = auth.uid() or public.has_role('platform_admin'));
create policy "profiles update own or admin" on public.profiles
  for update using (id = auth.uid() or public.has_role('platform_admin'));

create policy "roles select own or admin" on public.profile_roles
  for select using (profile_id = auth.uid() or public.has_role('platform_admin'));

create policy "customers own or admin" on public.customers
  for all using (profile_id = auth.uid() or public.has_role('platform_admin'))
  with check (profile_id = auth.uid() or public.has_role('platform_admin'));

create policy "cooperatives public verified select" on public.cooperatives
  for select using (status = 'verified' or public.is_cooperative_admin(id));
create policy "cooperatives admin manage" on public.cooperatives
  for all using (public.has_role('platform_admin'))
  with check (public.has_role('platform_admin'));

create policy "cooperative members scoped select" on public.cooperative_members
  for select using (profile_id = auth.uid() or public.is_cooperative_admin(cooperative_id));

create policy "addresses own or admin" on public.addresses
  for all using (
    profile_id = auth.uid()
    or public.has_role('platform_admin')
    or (cooperative_id is not null and public.is_cooperative_admin(cooperative_id))
  ) with check (
    profile_id = auth.uid()
    or public.has_role('platform_admin')
    or (cooperative_id is not null and public.is_cooperative_admin(cooperative_id))
  );

create policy "active categories readable" on public.service_categories
  for select using (is_active or public.has_role('platform_admin'));
create policy "platform admin manages categories" on public.service_categories
  for all using (public.has_role('platform_admin'))
  with check (public.has_role('platform_admin'));

create policy "active services readable" on public.services
  for select using (is_active or public.has_role('platform_admin'));
create policy "platform admin manages services" on public.services
  for all using (public.has_role('platform_admin'))
  with check (public.has_role('platform_admin'));

create policy "verified active workers readable" on public.workers
  for select using (
    (active and verification_status = 'verified')
    or profile_id = auth.uid()
    or public.is_cooperative_admin(cooperative_id)
  );
create policy "workers own update" on public.workers
  for update using (profile_id = auth.uid() or public.is_cooperative_admin(cooperative_id))
  with check (profile_id = auth.uid() or public.is_cooperative_admin(cooperative_id));

create policy "worker services readable" on public.worker_services
  for select using (true);
create policy "worker services own manage" on public.worker_services
  for all using (
    worker_id = auth.uid()
    or exists (select 1 from public.workers w where w.profile_id = worker_id and public.is_cooperative_admin(w.cooperative_id))
  ) with check (
    worker_id = auth.uid()
    or exists (select 1 from public.workers w where w.profile_id = worker_id and public.is_cooperative_admin(w.cooperative_id))
  );

create policy "worker skills readable" on public.worker_skills
  for select using (true);
create policy "worker skills own manage" on public.worker_skills
  for all using (worker_id = auth.uid()) with check (worker_id = auth.uid());

create policy "worker availability readable" on public.worker_availability
  for select using (true);
create policy "worker availability own manage" on public.worker_availability
  for all using (worker_id = auth.uid()) with check (worker_id = auth.uid());

create policy "bookings participant scoped" on public.bookings
  for select using (
    customer_id = auth.uid()
    or worker_id = auth.uid()
    or public.has_role('platform_admin')
    or exists (select 1 from public.workers w where w.profile_id = worker_id and public.is_cooperative_admin(w.cooperative_id))
  );
create policy "customers create own bookings" on public.bookings
  for insert with check (customer_id = auth.uid());
create policy "booking participant updates" on public.bookings
  for update using (
    customer_id = auth.uid()
    or worker_id = auth.uid()
    or public.has_role('platform_admin')
  );

create policy "booking history participant scoped" on public.booking_status_history
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or b.worker_id = auth.uid() or public.has_role('platform_admin'))
    )
  );

create policy "payments participant scoped" on public.payments
  for select using (
    customer_id = auth.uid()
    or worker_id = auth.uid()
    or public.has_role('platform_admin')
  );

create policy "invoices participant scoped" on public.invoices
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or b.worker_id = auth.uid() or public.has_role('platform_admin'))
    )
  );

create policy "reviews readable" on public.reviews for select using (true);
create policy "customers review completed booking" on public.reviews
  for insert with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.customer_id = auth.uid()
        and b.worker_id = reviews.worker_id
        and b.status = 'completed'
    )
  );

create policy "complaints scoped" on public.complaints
  for select using (submitted_by = auth.uid() or assigned_to = auth.uid() or public.has_role('platform_admin'));
create policy "complaints submit own" on public.complaints
  for insert with check (submitted_by = auth.uid());
create policy "complaints admin update" on public.complaints
  for update using (public.has_role('platform_admin')) with check (public.has_role('platform_admin'));

create policy "notifications own" on public.notifications
  for select using (recipient_id = auth.uid());
create policy "notifications mark read own" on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "worker documents owner or admin" on public.worker_documents
  for select using (
    worker_id = auth.uid()
    or public.has_role('platform_admin')
    or exists (select 1 from public.workers w where w.profile_id = worker_id and public.is_cooperative_admin(w.cooperative_id))
  );

create policy "conversations participant scoped" on public.conversations
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and (b.customer_id = auth.uid() or b.worker_id = auth.uid() or public.has_role('platform_admin'))
    )
  );

create policy "messages participant scoped" on public.messages
  for select using (
    exists (
      select 1
      from public.conversations c
      join public.bookings b on b.id = c.booking_id
      where c.id = conversation_id
        and (b.customer_id = auth.uid() or b.worker_id = auth.uid() or public.has_role('platform_admin'))
    )
  );
create policy "messages participant send" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      join public.bookings b on b.id = c.booking_id
      where c.id = conversation_id
        and (b.customer_id = auth.uid() or b.worker_id = auth.uid())
    )
  );

create policy "favorites own" on public.favorites
  for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy "analytics admin select" on public.analytics_events
  for select using (public.has_role('platform_admin'));

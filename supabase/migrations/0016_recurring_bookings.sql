create table if not exists public.recurring_bookings (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references public.profiles(id) on delete cascade,
 service_id uuid not null references public.services(id) on delete restrict,
 cooperative_id uuid not null references public.cooperatives(id) on delete cascade,
 frequency text not null check (frequency in ('daily','weekly','biweekly','monthly')),
 interval integer not null default 1 check (interval > 0),
 start_date date not null,
 end_date date,
 status text not null default 'active' check (status in ('active','paused','completed','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create index if not exists idx_recurring_bookings_customer on public.recurring_bookings(customer_id);
create index if not exists idx_recurring_bookings_cooperative on public.recurring_bookings(cooperative_id);

alter table public.recurring_bookings enable row level security;

create policy "Customers can view own recurring bookings"
 on public.recurring_bookings for select
 using (auth.uid() = customer_id);

create policy "Customers can insert own recurring bookings"
 on public.recurring_bookings for insert
 with check (auth.uid() = customer_id);

create policy "Customers can update own recurring bookings"
 on public.recurring_bookings for update
 using (auth.uid() = customer_id);

create policy "Customers can delete own recurring bookings"
 on public.recurring_bookings for delete
 using (auth.uid() = customer_id);

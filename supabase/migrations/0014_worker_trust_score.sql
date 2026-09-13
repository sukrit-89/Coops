-- Add trust score and enhanced worker metrics
alter table public.workers
 add column if not exists trust_score numeric(4,2) default 0.00 check (trust_score >= 0 and trust_score <= 5.00),
 add column if not exists rating numeric(3,2) default 0.00 check (rating >= 0 and rating <= 5.00),
 add column if not exists jobs_accepted integer not null default 0 check (jobs_accepted >= 0);

-- Add cooperative_id to bookings for easier settlement joins
alter table public.bookings
 add column if not exists cooperative_id uuid references public.cooperatives(id) on delete set null;

-- Backfill cooperative_id from workers table
update public.bookings b
set cooperative_id = w.cooperative_id
from public.workers w
where b.worker_id = w.profile_id
and b.cooperative_id is null;

create index if not exists bookings_cooperative_idx on public.bookings (cooperative_id);

-- Update worker_average_rating function to use reviews table
create or replace function public.worker_average_rating(target_worker_id uuid)
returns numeric
language sql
security definer
set search_path = public
as $$
 select coalesce(round(avg(rating)::numeric, 2), 0)
 from public.reviews
 where worker_id = target_worker_id;
$$;

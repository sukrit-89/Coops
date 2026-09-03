create table public.worker_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  cooperative_id uuid references public.cooperatives(id) on delete set null,
  requested_cooperative text,
  bio text,
  years_experience integer not null default 0 check (years_experience >= 0),
  service_interests text[] not null default '{}',
  status public.verification_status not null default 'pending',
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_cooperative_check check (cooperative_id is not null or requested_cooperative is not null)
);

create index worker_applications_profile_idx on public.worker_applications (profile_id, created_at desc);
create index worker_applications_status_idx on public.worker_applications (status, created_at desc);

create trigger worker_applications_updated_at before update on public.worker_applications
  for each row execute function public.set_updated_at();

alter table public.worker_applications enable row level security;

create policy "worker applications own select" on public.worker_applications
  for select using (profile_id = auth.uid());
create policy "worker applications own insert" on public.worker_applications
  for insert with check (profile_id = auth.uid());
create policy "worker applications cooperative review" on public.worker_applications
  for select using (cooperative_id is not null and public.is_cooperative_admin(cooperative_id));
create policy "worker applications admin update" on public.worker_applications
  for update using (
    public.has_role('platform_admin')
    or (cooperative_id is not null and public.is_cooperative_admin(cooperative_id))
  ) with check (
    public.has_role('platform_admin')
    or (cooperative_id is not null and public.is_cooperative_admin(cooperative_id))
  );

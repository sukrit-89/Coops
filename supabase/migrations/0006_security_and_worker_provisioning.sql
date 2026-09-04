create policy "platform admins review all applications" on public.worker_applications
  for select using (public.has_role('platform_admin'));

create policy "public verified worker profile names" on public.profiles
  for select using (
    exists (
      select 1 from public.workers w
      where w.profile_id = profiles.id
        and w.active = true
        and w.verification_status = 'verified'
    )
  );

create or replace function public.approve_worker_application(
  target_application_id uuid,
  target_cooperative_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  application_row public.worker_applications;
begin
  if not (public.has_role('platform_admin') or public.is_cooperative_admin(target_cooperative_id)) then
    raise exception 'Not authorized to approve worker applications';
  end if;

  select * into application_row
  from public.worker_applications
  where id = target_application_id
    and status = 'pending'
  for update;

  if application_row.id is null then
    raise exception 'Pending worker application not found';
  end if;

  insert into public.profile_roles (profile_id, role)
  values (application_row.profile_id, 'worker')
  on conflict (profile_id, role) do nothing;

  insert into public.cooperative_members (cooperative_id, profile_id, role)
  values (target_cooperative_id, application_row.profile_id, 'worker')
  on conflict (cooperative_id, profile_id, role) do nothing;

  insert into public.workers (
    profile_id,
    cooperative_id,
    bio,
    years_experience,
    verification_status,
    active
  )
  values (
    application_row.profile_id,
    target_cooperative_id,
    application_row.bio,
    application_row.years_experience,
    'verified',
    true
  )
  on conflict (profile_id) do update set
    cooperative_id = excluded.cooperative_id,
    bio = excluded.bio,
    years_experience = excluded.years_experience,
    verification_status = 'verified',
    active = true,
    updated_at = now();

  update public.worker_applications
  set cooperative_id = target_cooperative_id,
      status = 'verified',
      reviewer_notes = 'Approved and provisioned as a worker.'
  where id = target_application_id;
end;
$$;

grant execute on function public.approve_worker_application(uuid, uuid) to authenticated;

create or replace function public.get_public_worker_locations()
returns table (
  profile_id uuid,
  city text,
  state text,
  latitude double precision,
  longitude double precision
)
language sql
security definer
set search_path = public
stable
as $$
  select w.profile_id, a.city, a.state, a.latitude, a.longitude
  from public.workers w
  join public.addresses a on a.profile_id = w.profile_id
  where w.active = true
    and w.verification_status = 'verified';
$$;

grant execute on function public.get_public_worker_locations() to anon, authenticated;

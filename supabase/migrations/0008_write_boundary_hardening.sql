create or replace function public.update_worker_profile(
  target_full_name text,
  target_phone text,
  target_bio text,
  target_years_experience integer,
  target_service_radius_km integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profile_roles
    where profile_id = auth.uid() and role = 'worker'
  ) then
    raise exception 'Worker authorization required';
  end if;

  if target_years_experience < 0 or target_years_experience > 60
    or target_service_radius_km < 1 or target_service_radius_km > 150 then
    raise exception 'Invalid worker profile values';
  end if;

  update public.profiles
  set full_name = target_full_name, phone = nullif(target_phone, ''), updated_at = now()
  where id = auth.uid();

  update public.workers
  set bio = target_bio,
      years_experience = target_years_experience,
      service_radius_km = target_service_radius_km,
      updated_at = now()
  where profile_id = auth.uid();
end;
$$;

grant execute on function public.update_worker_profile(text, text, text, integer, integer) to authenticated;

revoke insert, update, delete on public.workers from authenticated;
revoke insert, update, delete on public.bookings from authenticated;

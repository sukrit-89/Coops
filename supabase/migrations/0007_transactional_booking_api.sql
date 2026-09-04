create or replace function public.create_booking_request(
  target_worker_id uuid,
  target_service_id uuid,
  target_scheduled_start timestamptz,
  target_scheduled_end timestamptz,
  target_line1 text,
  target_city text,
  target_state text,
  target_requirement text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_address_id uuid;
  new_booking_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if target_scheduled_start <= now() or target_scheduled_end <= target_scheduled_start then
    raise exception 'Booking time must be in the future';
  end if;

  if not exists (
    select 1 from public.workers
    where profile_id = target_worker_id
      and active = true
      and verification_status = 'verified'
  ) then
    raise exception 'Worker is not currently available';
  end if;

  if not exists (
    select 1 from public.worker_services
    where worker_id = target_worker_id and service_id = target_service_id
  ) then
    raise exception 'Service is not available from this worker';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_worker_id::text, 0));

  if exists (
    select 1 from public.bookings
    where worker_id = target_worker_id
      and status in ('requested', 'accepted', 'confirmed', 'worker_en_route', 'in_progress')
      and scheduled_start < target_scheduled_end
      and coalesce(scheduled_end, scheduled_start + interval '1 hour') > target_scheduled_start
  ) then
    raise exception 'Worker already has a booking around that time';
  end if;

  insert into public.addresses (profile_id, line1, city, state)
  values (auth.uid(), target_line1, target_city, target_state)
  returning id into new_address_id;

  insert into public.bookings (
    customer_id, worker_id, service_id, address_id,
    scheduled_start, scheduled_end, requirement
  )
  values (
    auth.uid(), target_worker_id, target_service_id, new_address_id,
    target_scheduled_start, target_scheduled_end, target_requirement
  )
  returning id into new_booking_id;

  insert into public.booking_status_history (booking_id, to_status, changed_by)
  values (new_booking_id, 'requested', auth.uid());

  insert into public.notifications (recipient_id, booking_id, title, body)
  values (target_worker_id, new_booking_id, 'New booking request', 'A customer sent you a new booking request.');

  return new_booking_id;
end;
$$;

grant execute on function public.create_booking_request(uuid, uuid, timestamptz, timestamptz, text, text, text, text) to authenticated;

create or replace function public.update_booking_status(
  target_booking_id uuid,
  target_status public.booking_status,
  target_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row public.bookings;
  actor_role public.app_role;
  is_coop_admin boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select b.* into booking_row
  from public.bookings b
  where b.id = target_booking_id
  for update;

  if booking_row.id is null then
    raise exception 'Booking not found';
  end if;

  if booking_row.worker_id = auth.uid() then
    actor_role := 'worker';
  elsif booking_row.customer_id = auth.uid() then
    actor_role := 'customer';
  elsif public.has_role('platform_admin') then
    actor_role := 'platform_admin';
  else
    select exists (
      select 1 from public.workers w
      where w.profile_id = booking_row.worker_id
        and public.is_cooperative_admin(w.cooperative_id)
    ) into is_coop_admin;
    if is_coop_admin then actor_role := 'cooperative_admin'; end if;
  end if;

  if actor_role is null then
    raise exception 'Not authorized to update this booking';
  end if;

  if not (
    (actor_role = 'platform_admin')
    or (actor_role = 'customer' and (
      (booking_row.status = 'requested' and target_status = 'cancelled')
      or (booking_row.status = 'confirmed' and target_status in ('cancelled', 'disputed'))
    ))
    or (actor_role = 'worker' and (
      (booking_row.status = 'requested' and target_status in ('accepted', 'rejected'))
      or (booking_row.status = 'accepted' and target_status in ('confirmed', 'cancelled'))
      or (booking_row.status = 'confirmed' and target_status in ('worker_en_route', 'cancelled', 'disputed'))
      or (booking_row.status = 'worker_en_route' and target_status in ('in_progress', 'disputed'))
      or (booking_row.status = 'in_progress' and target_status in ('completed', 'disputed'))
    ))
    or (actor_role = 'cooperative_admin' and (
      (booking_row.status = 'accepted' and target_status = 'confirmed')
      or (booking_row.status = 'confirmed' and target_status in ('cancelled', 'disputed'))
    ))
  ) then
    raise exception 'Invalid booking status transition';
  end if;

  update public.bookings
  set status = target_status, updated_at = now()
  where id = target_booking_id;

  insert into public.booking_status_history (booking_id, from_status, to_status, changed_by, note)
  values (target_booking_id, booking_row.status, target_status, auth.uid(), target_note);
end;
$$;

grant execute on function public.update_booking_status(uuid, public.booking_status, text) to authenticated;

create or replace function public.notify_booking_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, booking_id, title, body)
  values (new.worker_id, new.id, 'New booking request', 'A customer sent you a new booking request.');
  return new;
end;
$$;

drop trigger if exists booking_created_notification on public.bookings;
create trigger booking_created_notification
after insert on public.bookings
for each row execute function public.notify_booking_created();

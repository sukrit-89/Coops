create or replace function public.notify_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.notifications (recipient_id, booking_id, title, body)
    values
      (
        case when auth.uid() = new.customer_id then new.worker_id else new.customer_id end,
        new.id,
        'Booking status updated',
        'Your booking is now ' || replace(new.status::text, '_', ' ') || '.'
      );
  end if;
  return new;
end;
$$;

drop trigger if exists booking_status_notification on public.bookings;
create trigger booking_status_notification
after update of status on public.bookings
for each row execute function public.notify_booking_status_change();

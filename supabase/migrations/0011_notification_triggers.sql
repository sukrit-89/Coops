-- Migration 0011: Automated database notification triggers
-- Fixed: removed non-existent notifications.type column references

-- Trigger function for booking status changes
create or replace function public.notify_on_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
 if (TG_OP = 'UPDATE' and OLD.status is distinct from NEW.status) then
 insert into notifications (recipient_id, booking_id, title, body)
 values (
 NEW.customer_id,
 NEW.id,
 'Booking Status Updated',
 'Your booking status changed to ' || replace(NEW.status::text, '_', ' ')
 );

 insert into notifications (recipient_id, booking_id, title, body)
 values (
 NEW.worker_id,
 NEW.id,
 'Booking Status Updated',
 'Service booking status changed to ' || replace(NEW.status::text, '_', ' ')
 );
 end if;
 return NEW;
end;
$$;

drop trigger if exists trigger_notify_booking_status on public.bookings;
create trigger trigger_notify_booking_status
after update on public.bookings
for each row
execute function public.notify_on_booking_status_change();


-- Trigger function for payment status changes
create or replace function public.notify_on_payment_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
 if (TG_OP = 'INSERT' or (TG_OP = 'UPDATE' and OLD.status is distinct from NEW.status)) then
 if (NEW.status = 'paid') then
 insert into notifications (recipient_id, booking_id, title, body)
 values (
 NEW.worker_id,
 NEW.booking_id,
 'Payment Verified',
 'Payment received for completed service.'
 );
 end if;
 end if;
 return NEW;
end;
$$;

drop trigger if exists trigger_notify_payment_status on public.payments;
create trigger trigger_notify_payment_status
after insert or update on public.payments
for each row
execute function public.notify_on_payment_status_change();

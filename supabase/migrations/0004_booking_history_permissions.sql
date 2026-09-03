create policy "customers create booking history" on public.booking_status_history
  for insert with check (
    changed_by = auth.uid()
    and to_status = 'requested'
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid()
    )
  );

create policy "workers create booking history" on public.booking_status_history
  for insert with check (
    changed_by = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.worker_id = auth.uid()
    )
  );

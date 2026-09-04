create policy "participants create conversations" on public.conversations
  for insert with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or b.worker_id = auth.uid())
    )
  );

create policy "complaint submitter update" on public.complaints
  for update using (submitted_by = auth.uid())
  with check (submitted_by = auth.uid());

create or replace function public.update_worker_settings(
  p_worker_id uuid,
  p_service_ids uuid[],
  p_skills text[],
  p_availability jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  elem jsonb;
begin
  if auth.uid() <> p_worker_id then
    raise exception 'Unauthorized to update settings for this worker';
  end if;

  delete from worker_services where worker_id = p_worker_id;
  delete from worker_skills where worker_id = p_worker_id;
  delete from worker_availability where worker_id = p_worker_id;

  if array_length(p_service_ids, 1) > 0 then
    insert into worker_services (worker_id, service_id)
    select p_worker_id, unnest(p_service_ids);
  end if;

  if array_length(p_skills, 1) > 0 then
    insert into worker_skills (worker_id, name)
    select p_worker_id, unnest(p_skills);
  end if;

  if jsonb_array_length(p_availability) > 0 then
    for elem in select * from jsonb_array_elements(p_availability)
    loop
      insert into worker_availability (worker_id, day_of_week, starts_at, ends_at)
      values (
        p_worker_id,
        (elem->>'day')::int,
        (elem->>'startsAt')::time,
        (elem->>'endsAt')::time
      );
    end loop;
  end if;
end;
$$;

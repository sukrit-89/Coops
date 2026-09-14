-- Fix auth user bootstrap to respect account_intent metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  user_intent text;
  assigned_role public.app_role;
begin
  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Coops member'
  );

  user_intent := new.raw_user_meta_data ->> 'account_intent';

  if user_intent = 'cooperative_admin' then
    assigned_role := 'cooperative_admin';
  elsif user_intent = 'worker' then
    assigned_role := 'worker';
  else
    assigned_role := 'customer';
  end if;

  insert into public.profiles (id, full_name, phone)
  values (new.id, display_name, new.phone)
  on conflict (id) do update set full_name = excluded.full_name;

  insert into public.profile_roles (profile_id, role)
  values (new.id, assigned_role)
  on conflict (profile_id, role) do nothing;

  if assigned_role = 'customer' then
    insert into public.customers (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill existing users registered with account_intent
insert into public.profile_roles (profile_id, role)
select id, (raw_user_meta_data ->> 'account_intent')::public.app_role
from auth.users
where raw_user_meta_data ->> 'account_intent' in ('cooperative_admin', 'worker', 'customer', 'platform_admin')
on conflict (profile_id, role) do nothing;

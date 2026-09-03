create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Coops member'
  );

  insert into public.profiles (id, full_name, phone)
  values (new.id, display_name, new.phone)
  on conflict (id) do nothing;

  insert into public.profile_roles (profile_id, role)
  values (new.id, 'customer')
  on conflict (profile_id, role) do nothing;

  insert into public.customers (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.service_categories (name, slug, description)
values
  ('Electrical', 'electrical', 'Electrical installation, repair, and maintenance'),
  ('Plumbing', 'plumbing', 'Pipe, tap, water flow, and sanitation repair'),
  ('Carpentry', 'carpentry', 'Furniture, fixtures, and woodwork services'),
  ('Cleaning', 'cleaning', 'Home and workplace cleaning support')
on conflict (slug) do nothing;

insert into public.services (category_id, name, slug, description)
select id, 'Fan repair', 'fan-repair', 'Ceiling and table fan diagnosis and repair'
from public.service_categories where slug = 'electrical'
on conflict (slug) do nothing;

insert into public.services (category_id, name, slug, description)
select id, 'Tap leakage repair', 'tap-leakage-repair', 'Leak detection and fixture repair'
from public.service_categories where slug = 'plumbing'
on conflict (slug) do nothing;

insert into public.services (category_id, name, slug, description)
select id, 'Door hinge repair', 'door-hinge-repair', 'Door alignment, hinge, and latch repair'
from public.service_categories where slug = 'carpentry'
on conflict (slug) do nothing;

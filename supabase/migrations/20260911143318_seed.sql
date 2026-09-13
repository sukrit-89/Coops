-- Initial seed data for service categories, services, catalog items, and demand forecasts

insert into public.service_categories (name, slug, description)
values
  ('Electrical', 'electrical', 'Electrical installation, repair, and maintenance'),
  ('Plumbing', 'plumbing', 'Pipe, tap, water flow, and sanitation repair'),
  ('Carpentry', 'carpentry', 'Furniture, fixtures, and woodwork services'),
  ('Cleaning', 'cleaning', 'Home and workplace cleaning support'),
  ('Painting', 'painting', 'Interior and exterior house painting services'),
  ('Maintenance', 'maintenance', 'General home and appliance maintenance'),
  ('Repair', 'repair', 'Appliance and fixture restoration'),
  ('Domestic Services', 'domestic-services', 'In-home care and housekeeping support')
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

insert into public.services (category_id, name, slug, description)
select id, 'Wall Painting', 'wall-painting', 'Single room or full house interior painting'
from public.service_categories where slug = 'painting'
on conflict (slug) do nothing;

insert into public.services (category_id, name, slug, description)
select id, 'AC Service & Maintenance', 'ac-service', 'Air conditioner cleaning and maintenance'
from public.service_categories where slug = 'maintenance'
on conflict (slug) do nothing;

INSERT INTO public.service_catalog_items (name, sku, unit_price_cents, description) VALUES
  ('Detergent Refill 500ml', 'DET-500', 150, 'Standard laundry detergent'),
  ('Fabric Softener 1L', 'FAB-1L', 250, 'Fabric softener for laundry')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.demand_forecasts (service_id, zone, forecast_date, predicted_jobs, confidence_low, confidence_high)
SELECT id, 'central', '2026-09-15', 12, 8, 16 FROM public.services LIMIT 1;

INSERT INTO public.demand_forecasts (service_id, zone, forecast_date, predicted_jobs, confidence_low, confidence_high)
SELECT id, 'north', '2026-09-15', 5, 3, 8 FROM public.services LIMIT 1;

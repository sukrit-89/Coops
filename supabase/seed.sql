-- Seed service categories
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

-- Seed services
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

-- Seed sample cooperative
insert into public.cooperatives (id, name, registration_number, status) values
  ('a1111111-1111-1111-1111-111111111111', 'Mumbai Skill Cooperative', 'COOP-MH-2024-001', 'verified')
on conflict (id) do nothing;

-- Seed auth users for demo workers
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'rajesh.sharma@example.com', '$2a$10$abcdefghijklmnopqrstuu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rajesh Sharma"}', now(), now(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'amit.verma@example.com', '$2a$10$abcdefghijklmnopqrstuu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Amit Verma"}', now(), now(), 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'sunil.kumar@example.com', '$2a$10$abcdefghijklmnopqrstuu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sunil Kumar"}', now(), now(), 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'priya.patel@example.com', '$2a$10$abcdefghijklmnopqrstuu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Patel"}', now(), now(), 'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'vikram.singh@example.com', '$2a$10$abcdefghijklmnopqrstuu', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vikram Singh"}', now(), now(), 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- Seed sample worker profiles
insert into public.profiles (id, full_name, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Rajesh Sharma', '+919876543210'),
  ('22222222-2222-2222-2222-222222222222', 'Amit Verma', '+919876543211'),
  ('33333333-3333-3333-3333-333333333333', 'Sunil Kumar', '+919876543212'),
  ('44444444-4444-4444-4444-444444444444', 'Priya Patel', '+919876543213'),
  ('55555555-5555-5555-5555-555555555555', 'Vikram Singh', '+919876543214')
on conflict (id) do nothing;

-- Seed worker roles
insert into public.profile_roles (profile_id, role) values
  ('11111111-1111-1111-1111-111111111111', 'worker'),
  ('22222222-2222-2222-2222-222222222222', 'worker'),
  ('33333333-3333-3333-3333-333333333333', 'worker'),
  ('44444444-4444-4444-4444-444444444444', 'worker'),
  ('55555555-5555-5555-5555-555555555555', 'worker')
on conflict (profile_id, role) do nothing;

-- Seed worker details
insert into public.workers (profile_id, cooperative_id, active, verification_status, years_experience, completed_jobs, rating, trust_score) values
  ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', true, 'verified', 8, 54, 4.90, 4.90),
  ('22222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', true, 'verified', 6, 38, 4.80, 4.80),
  ('33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', true, 'verified', 10, 82, 4.95, 4.95),
  ('44444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', true, 'verified', 4, 25, 4.70, 4.70),
  ('55555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', true, 'verified', 7, 46, 4.85, 4.85)
on conflict (profile_id) do nothing;

-- Seed worker services mappings
insert into public.worker_services (worker_id, service_id, base_price_cents)
select '11111111-1111-1111-1111-111111111111', id, 35000 from public.services where slug = 'fan-repair'
on conflict do nothing;

insert into public.worker_services (worker_id, service_id, base_price_cents)
select '11111111-1111-1111-1111-111111111111', id, 75000 from public.services where slug = 'ac-service'
on conflict do nothing;

insert into public.worker_services (worker_id, service_id, base_price_cents)
select '22222222-2222-2222-2222-222222222222', id, 40000 from public.services where slug = 'tap-leakage-repair'
on conflict do nothing;

insert into public.worker_services (worker_id, service_id, base_price_cents)
select '33333333-3333-3333-3333-333333333333', id, 45000 from public.services where slug = 'door-hinge-repair'
on conflict do nothing;

insert into public.worker_services (worker_id, service_id, base_price_cents)
select '44444444-4444-4444-4444-444444444444', id, 150000 from public.services where slug = 'wall-painting'
on conflict do nothing;

insert into public.worker_services (worker_id, service_id, base_price_cents)
select '55555555-5555-5555-5555-555555555555', id, 80000 from public.services where slug = 'ac-service'
on conflict do nothing;

-- Seed worker weekly availability
insert into public.worker_availability (worker_id, day_of_week, starts_at, ends_at, is_active) values
  ('11111111-1111-1111-1111-111111111111', 0, '09:00', '18:00', true),
  ('11111111-1111-1111-1111-111111111111', 1, '09:00', '18:00', true),
  ('11111111-1111-1111-1111-111111111111', 2, '09:00', '18:00', true),
  ('11111111-1111-1111-1111-111111111111', 3, '09:00', '18:00', true),
  ('11111111-1111-1111-1111-111111111111', 4, '09:00', '18:00', true),
  ('11111111-1111-1111-1111-111111111111', 5, '09:00', '18:00', true),
  ('11111111-1111-1111-1111-111111111111', 6, '09:00', '18:00', true),
  ('22222222-2222-2222-2222-222222222222', 0, '09:00', '18:00', true),
  ('22222222-2222-2222-2222-222222222222', 1, '09:00', '18:00', true),
  ('22222222-2222-2222-2222-222222222222', 2, '09:00', '18:00', true),
  ('22222222-2222-2222-2222-222222222222', 3, '09:00', '18:00', true),
  ('22222222-2222-2222-2222-222222222222', 4, '09:00', '18:00', true),
  ('22222222-2222-2222-2222-222222222222', 5, '09:00', '18:00', true),
  ('33333333-3333-3333-3333-333333333333', 1, '09:00', '18:00', true),
  ('33333333-3333-3333-3333-333333333333', 2, '09:00', '18:00', true),
  ('33333333-3333-3333-3333-333333333333', 3, '09:00', '18:00', true),
  ('33333333-3333-3333-3333-333333333333', 4, '09:00', '18:00', true),
  ('33333333-3333-3333-3333-333333333333', 5, '09:00', '18:00', true),
  ('44444444-4444-4444-4444-444444444444', 1, '09:00', '18:00', true),
  ('44444444-4444-4444-4444-444444444444', 2, '09:00', '18:00', true),
  ('44444444-4444-4444-4444-444444444444', 3, '09:00', '18:00', true),
  ('55555555-5555-5555-5555-555555555555', 1, '09:00', '18:00', true),
  ('55555555-5555-5555-5555-555555555555', 2, '09:00', '18:00', true),
  ('55555555-5555-5555-5555-555555555555', 3, '09:00', '18:00', true)
on conflict do nothing;

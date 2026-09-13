INSERT INTO service_catalog_items (name, sku, unit_price_cents, description) VALUES
 ('Detergent Refill 500ml', 'DET-500', 150, 'Standard laundry detergent'),
 ('Fabric Softener 1L', 'FAB-1L', 250, 'Fabric softener for laundry');

INSERT INTO demand_forecasts (service_id, zone, forecast_date, predicted_jobs, confidence_low, confidence_high) VALUES
 ((SELECT id FROM services LIMIT 1), 'central', '2026-09-15', 12, 8, 16),
 ((SELECT id FROM services LIMIT 1), 'north', '2026-09-15', 5, 3, 8);

-- Add cooperative scoping to demand forecasts so cooperative admins
-- only see their own cooperative's forecasts.

ALTER TABLE IF EXISTS public.demand_forecasts
 ADD COLUMN IF NOT EXISTS cooperative_id uuid REFERENCES public.cooperatives(id);

-- Composite index for efficient scoped queries
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_coop_service
 ON public.demand_forecasts(service_id, cooperative_id, forecast_date DESC);

-- Backfill cooperative_id from workers who offer each service
-- (joins through worker_services → workers)
UPDATE public.demand_forecasts df
SET cooperative_id = w.cooperative_id
FROM public.worker_services ws
JOIN public.workers w ON ws.worker_id = w.profile_id
WHERE df.cooperative_id IS NULL
 AND df.service_id = ws.service_id;

-- Non-nullable now that we've backfilled
ALTER TABLE IF EXISTS public.demand_forecasts
 ALTER COLUMN cooperative_id SET NOT NULL;

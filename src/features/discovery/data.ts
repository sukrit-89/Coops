import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rankWorkers, type RankedWorker, type WorkerCandidate } from "@/lib/domain/matching";

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type DiscoveryFilters = {
  query?: string;
  category?: string;
  city?: string;
};

function databaseError(message: string) {
  if (message.includes("schema cache") || message.includes("does not exist")) {
    return "Supabase is connected, but the database schema is not installed. Run the SQL files in supabase/migrations and supabase/seed.sql in your Supabase project, then reload this page.";
  }

  return message;
}

type WorkerServiceRow = {
  worker_id: string;
  service_id: string;
  base_price_cents: number | null;
  services: {
    id: string;
    name: string;
    slug: string;
    category_id: string;
    service_categories: {
      name: string;
      slug: string;
    } | null;
  } | null;
  workers: {
    profile_id: string;
    years_experience: number;
    completed_jobs: number;
    active: boolean;
    verification_status: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
};

type AddressRow = {
  profile_id: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
};

type ReviewRow = {
  worker_id: string;
  rating: number;
};

type AvailabilityRow = {
  worker_id: string;
  day_of_week: number;
  is_active: boolean;
};

export async function getServiceCategories() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { data: [] as ServiceCategory[], error: "Supabase is not configured yet." };
  }

  const { data, error } = await supabase
    .from("service_categories")
    .select("id,name,slug,description")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return { data: [] as ServiceCategory[], error: databaseError(error.message) };
  }

  return { data: data ?? [], error: null };
}

export async function discoverWorkers(filters: DiscoveryFilters) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { data: [] as RankedWorker[], error: "Supabase is not configured yet." };
  }

  let query = supabase
    .from("worker_services")
    .select(`
      worker_id,
      service_id,
      base_price_cents,
      services!inner(id,name,slug,category_id,service_categories(name,slug)),
      workers!inner(profile_id,years_experience,completed_jobs,active,verification_status,profiles(full_name))
    `)
    .eq("workers.active", true)
    .eq("workers.verification_status", "verified")
    .limit(24);

  if (filters.category) {
    query = query.eq("services.service_categories.slug", filters.category);
  }

  if (filters.query) {
    query = query.ilike("services.name", `%${filters.query}%`);
  }

  const { data, error } = await query;
  if (error) {
    return { data: [] as RankedWorker[], error: databaseError(error.message) };
  }

  const rows = (data ?? []) as unknown as WorkerServiceRow[];
  const workerIds = rows.map((row) => row.worker_id);

  const [{ data: addresses }, { data: reviews }, { data: availability }] = await Promise.all([
    supabase.from("addresses").select("profile_id,city,latitude,longitude").in("profile_id", workerIds),
    supabase.from("reviews").select("worker_id,rating").in("worker_id", workerIds),
    supabase.from("worker_availability").select("worker_id,day_of_week,is_active").in("worker_id", workerIds).eq("is_active", true)
  ]);

  const addressRows = (addresses ?? []) as unknown as AddressRow[];
  const reviewRows = (reviews ?? []) as unknown as ReviewRow[];
  const availabilityRows = (availability ?? []) as unknown as AvailabilityRow[];

  const addressByWorker = new Map(addressRows.map((address) => [address.profile_id, address]));
  const ratingsByWorker = new Map<string, number[]>();
  for (const review of reviewRows) {
    const ratings = ratingsByWorker.get(review.worker_id) ?? [];
    ratings.push(review.rating);
    ratingsByWorker.set(review.worker_id, ratings);
  }
  const availableWorkers = new Set(availabilityRows.map((item) => item.worker_id));

  const candidates: WorkerCandidate[] = rows
    .map((row): WorkerCandidate | null => {
      const worker = row.workers;
      const service = row.services;
      if (!worker || !service) {
        return null;
      }

      const address = addressByWorker.get(row.worker_id);
      if (filters.city && address?.city?.toLowerCase() !== filters.city.toLowerCase()) {
        return null;
      }

      const ratings = ratingsByWorker.get(row.worker_id) ?? [];
      const averageRating = ratings.length
        ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
        : 0;

      return {
        workerId: row.worker_id,
        fullName: worker.profiles?.full_name ?? "Unnamed worker",
        serviceName: service.name,
        city: address?.city ?? null,
        distanceKm: null,
        yearsExperience: worker.years_experience,
        averageRating,
        completedJobs: worker.completed_jobs,
        isAvailable: availableWorkers.has(row.worker_id),
        skillMatch: true
      };
    })
    .filter((candidate): candidate is WorkerCandidate => candidate !== null);

  return { data: rankWorkers(candidates), error: null };
}

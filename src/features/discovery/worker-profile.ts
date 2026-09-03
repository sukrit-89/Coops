import { createSupabaseServerClient } from "@/lib/supabase/server";

type WorkerProfileRow = {
  profile_id: string;
  bio: string | null;
  years_experience: number;
  service_radius_km: number;
  completed_jobs: number;
  verification_status: string;
  profiles: {
    full_name: string;
    phone: string | null;
  } | null;
  cooperatives: {
    name: string;
  } | null;
};

export async function getWorkerProfile(workerId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { data: null, error: "Supabase is not configured yet." };
  }

  const [{ data: worker, error }, { data: services }, { data: availability }, { data: reviews }, { data: addresses }] =
    await Promise.all([
      supabase
        .from("workers")
        .select("profile_id,bio,years_experience,service_radius_km,completed_jobs,verification_status,profiles(full_name,phone),cooperatives(name)")
        .eq("profile_id", workerId)
        .single(),
      supabase
        .from("worker_services")
        .select("service_id,base_price_cents,services(name,slug)")
        .eq("worker_id", workerId),
      supabase
        .from("worker_availability")
        .select("day_of_week,starts_at,ends_at")
        .eq("worker_id", workerId)
        .eq("is_active", true)
        .order("day_of_week"),
      supabase.from("reviews").select("rating,body,created_at").eq("worker_id", workerId).order("created_at", { ascending: false }).limit(5),
      supabase.from("addresses").select("city,state").eq("profile_id", workerId).limit(1)
    ]);

  if (error) {
    return { data: null, error: error.message };
  }

  const workerRow = worker as unknown as WorkerProfileRow;
  const reviewRows = (reviews ?? []) as unknown as { rating: number; body: string | null; created_at: string }[];
  const averageRating = reviewRows.length
    ? reviewRows.reduce((total, review) => total + review.rating, 0) / reviewRows.length
    : 0;

  return {
    data: {
      worker: workerRow,
      services: (services ?? []) as unknown as { service_id: string; base_price_cents: number | null; services: { name: string; slug: string } | null }[],
      availability: (availability ?? []) as unknown as { day_of_week: number; starts_at: string; ends_at: string }[],
      reviews: reviewRows,
      address: ((addresses ?? []) as unknown as { city: string; state: string }[])[0] ?? null,
      averageRating
    },
    error: null
  };
}

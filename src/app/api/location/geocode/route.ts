import { NextResponse } from "next/server";
import { z } from "zod";

const addressSchema = z.object({ address: z.string().trim().min(3).max(300) });

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Google Maps geocoding is not configured on the server." }, { status: 503 });
  const parsed = addressSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "A valid address is required." }, { status: 400 });

  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(parsed.data.address)}&key=${encodeURIComponent(apiKey)}`, { cache: "no-store" });
  const result = await response.json() as { status?: string; error_message?: string; results?: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[] };
  if (!response.ok || result.status !== "OK" || !result.results?.[0]) return NextResponse.json({ error: result.error_message ?? "Address could not be geocoded." }, { status: 502 });
  return NextResponse.json({ address: result.results[0].formatted_address, latitude: result.results[0].geometry.location.lat, longitude: result.results[0].geometry.location.lng });
}

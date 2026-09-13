export type DistanceMatrixResponse = {
 origin: { latitude: number; longitude: number };
 destination: { latitude: number; longitude: number };
 distanceMeters: number | null;
 durationSeconds: number | null;
};

export async function getDistanceMatrix(
 originLat: number,
 originLng: number,
 destinationLat: number,
 destinationLng: number,
): Promise<DistanceMatrixResponse> {
 const apiKey = process.env.GOOGLE_MAPS_API_KEY;
 if (!apiKey) {
 return {
 origin: { latitude: originLat, longitude: originLng },
 destination: { latitude: destinationLat, longitude: destinationLng },
 distanceMeters: null,
 durationSeconds: null,
 };
 }

 const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
 url.searchParams.set("origins", `${originLat},${originLng}`);
 url.searchParams.set("destinations", `${destinationLat},${destinationLng}`);
 url.searchParams.set("units", "metric");
 url.searchParams.set("key", apiKey);

 try {
 const res = await fetch(url.toString());
 if (!res.ok) throw new Error(`Distance matrix failed: ${res.status}`);
 const json = await res.json();
 const element = json?.rows?.[0]?.elements?.[0];

 if (element?.status === "OK") {
 return {
 origin: { latitude: originLat, longitude: originLng },
 destination: { latitude: destinationLat, longitude: destinationLng },
 distanceMeters: element.distance?.value ?? null,
 durationSeconds: element.duration?.value ?? null,
 };
 }
 } catch {
 // Fallback to Haversine approximation
 }

 const R = 6371000;
 const toRad = (deg: number) => (deg * Math.PI) / 180;
 const dLat = toRad(destinationLat - originLat);
 const dLng = toRad(destinationLng - originLng);
 const a =
 Math.sin(dLat / 2) ** 2 +
 Math.cos(toRad(originLat)) * Math.cos(toRad(destinationLat)) * Math.sin(dLng / 2) ** 2;
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 const distanceMeters = Math.round(R * c);

 return {
 origin: { latitude: originLat, longitude: originLng },
 destination: { latitude: destinationLat, longitude: destinationLng },
 distanceMeters,
 durationSeconds: null,
 };
}

export function haversineDistanceKm(
 originLat: number,
 originLng: number,
 destinationLat: number,
 destinationLng: number,
): number {
 const R = 6371;
 const toRad = (deg: number) => (deg * Math.PI) / 180;
 const dLat = toRad(destinationLat - originLat);
 const dLng = toRad(destinationLng - originLng);
 const a =
 Math.sin(dLat / 2) ** 2 +
 Math.cos(toRad(originLat)) * Math.cos(toRad(destinationLat)) * Math.sin(dLng / 2) ** 2;
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 return R * c;
}

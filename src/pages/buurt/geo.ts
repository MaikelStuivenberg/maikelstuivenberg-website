import type { GeoPoint, KioskLocation } from "./types";

const PDOK =
  "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function geocodeDutch(query: string): Promise<GeoPoint | null> {
  const q = query.trim();
  if (!q) return null;
  const url = `${PDOK}?q=${encodeURIComponent(q)}&rows=5`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    response?: {
      docs?: Array<{
        centroide_ll?: string;
        weergavenaam?: string;
        postcode?: string;
        woonplaatsnaam?: string;
      }>;
    };
  };
  const doc = data.response?.docs?.[0];
  if (!doc?.centroide_ll) return null;
  const m = doc.centroide_ll.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  const lon = Number(m[1]);
  const lat = Number(m[2]);
  const label =
    doc.weergavenaam ??
    [doc.postcode, doc.woonplaatsnaam].filter(Boolean).join(" ");
  return { lat, lon, label };
}

export function nearestLocations(
  origin: GeoPoint,
  locations: KioskLocation[],
  limit = 6,
): Array<KioskLocation & { distanceKm: number }> {
  return locations
    .map((loc) => ({
      ...loc,
      distanceKm: haversineKm(origin.lat, origin.lon, loc.lat, loc.lon),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

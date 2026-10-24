import type { GeoPoint, KioskLocation } from "./types";

const PDOK = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";

/** Minimum PDOK postcode hits to treat a 4-digit input as a valid postcode area. */
const MIN_PC4_POSTCODE_HITS = 10;

const DOC_TYPE_PRIORITY = [
  "woonplaats",
  "gemeente",
  "postcode",
  "adres",
  "weg",
] as const;

type PdokDoc = {
  centroide_ll?: string;
  weergavenaam?: string;
  postcode?: string;
  woonplaatsnaam?: string;
  type?: string;
};

type PdokResponse = {
  response?: {
    numFound?: number;
    docs?: PdokDoc[];
  };
};

export function normalizeDutchLocationInput(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export type LocationQueryPlan =
  | { kind: "full_postcode"; q: string }
  | { kind: "pc4"; digits: string }
  | { kind: "place"; q: string };

export function planDutchLocationQuery(raw: string): LocationQueryPlan | null {
  const s = normalizeDutchLocationInput(raw);
  if (!s) return null;

  const full = s.match(/^(\d{4})\s*([A-Za-z]{2})$/);
  if (full) {
    const q = `${full[1]} ${full[2].toUpperCase()}`;
    return { kind: "full_postcode", q };
  }

  if (/^\d{4}$/.test(s)) {
    return { kind: "pc4", digits: s };
  }

  return { kind: "place", q: s };
}

async function pdokSearch(params: {
  q: string;
  fq?: string;
  rows: number;
}): Promise<PdokResponse> {
  const url = new URL(PDOK);
  url.searchParams.set("q", params.q);
  url.searchParams.set("rows", String(params.rows));
  if (params.fq) url.searchParams.set("fq", params.fq);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`PDOK ${res.status}`);
  return (await res.json()) as PdokResponse;
}

function docToPoint(doc: PdokDoc): GeoPoint | null {
  if (!doc.centroide_ll) return null;
  const m = doc.centroide_ll.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  const lon = Number(m[1]);
  const lat = Number(m[2]);
  const label =
    doc.weergavenaam ??
    [doc.postcode, doc.woonplaatsnaam].filter(Boolean).join(" ");
  return { lat, lon, label };
}

function pickBestDoc(docs: PdokDoc[]): PdokDoc | undefined {
  if (!docs.length) return undefined;
  const ranked = [...docs].sort((a, b) => {
    const ai = DOC_TYPE_PRIORITY.indexOf(
      (a.type ?? "") as (typeof DOC_TYPE_PRIORITY)[number],
    );
    const bi = DOC_TYPE_PRIORITY.indexOf(
      (b.type ?? "") as (typeof DOC_TYPE_PRIORITY)[number],
    );
    const ap = ai === -1 ? DOC_TYPE_PRIORITY.length : ai;
    const bp = bi === -1 ? DOC_TYPE_PRIORITY.length : bi;
    return ap - bp;
  });
  return ranked.find((d) => d.centroide_ll) ?? ranked[0];
}

export async function geocodeDutch(query: string): Promise<GeoPoint | null> {
  const plan = planDutchLocationQuery(query);
  if (!plan) return null;

  try {
    if (plan.kind === "full_postcode") {
      const compact = plan.q.replace(/\s+/g, "");
      for (const q of [plan.q, compact]) {
        const data = await pdokSearch({ q, fq: "type:postcode", rows: 5 });
        const doc = pickBestDoc(data.response?.docs ?? []);
        const point = doc ? docToPoint(doc) : null;
        if (point) return point;
      }
      const fallback = await pdokSearch({ q: plan.q, rows: 5 });
      const doc = pickBestDoc(fallback.response?.docs ?? []);
      return doc ? docToPoint(doc) : null;
    }

    if (plan.kind === "pc4") {
      const data = await pdokSearch({
        q: plan.digits,
        fq: "type:postcode",
        rows: 50,
      });
      const matching = (data.response?.docs ?? []).filter((d) => {
        const pc = (d.postcode ?? "").replace(/\s/g, "");
        return pc.length >= 4 && pc.slice(0, 4) === plan.digits;
      });
      if (matching.length < MIN_PC4_POSTCODE_HITS) return null;
      const doc = matching[0];
      return doc ? docToPoint(doc) : null;
    }

    const data = await pdokSearch({ q: plan.q, rows: 8 });
    const doc = pickBestDoc(data.response?.docs ?? []);
    return doc ? docToPoint(doc) : null;
  } catch {
    return null;
  }
}

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

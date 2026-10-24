/**
 * Downloads Netherlands outline (simplified) into public/data and src/pages/buurt.
 */
import { writeFileSync } from "node:fs";

const url =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";
const data = await fetch(url).then((r) => r.json());
const nl = data.features.find((f) => f.properties?.ISO_A2 === "NL");
if (!nl) throw new Error("Netherlands feature not found");

let coords = nl.geometry.coordinates;
if (nl.geometry.type === "MultiPolygon") {
  coords = coords.reduce((a, b) => (b[0].length > a[0].length ? b : a), coords[0]);
}
const ring = coords[0];
const step = Math.max(1, Math.floor(ring.length / 120));
const simp = ring.filter((_, i) => i % step === 0);
if (simp[simp.length - 1] !== ring[ring.length - 1]) simp.push(ring[ring.length - 1]);

const lons = simp.map((p) => p[0]);
const lats = simp.map((p) => p[1]);
const out = {
  source: "geo-countries (Natural Earth derived)",
  bounds: {
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  },
  ring: simp.map(([lon, lat]) => [lon, lat]),
};

const json = JSON.stringify(out, null, 2);
writeFileSync("public/data/nl-outline.json", json);
writeFileSync("src/pages/buurt/nl-outline.json", json);
console.log(`Wrote nl-outline.json (${simp.length} points)`);

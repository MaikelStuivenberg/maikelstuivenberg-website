/**
 * Verify kiosk location dots project onto land using the same outline + projection.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const outline = JSON.parse(
  readFileSync("src/pages/buurt/nl-outline.json", "utf8"),
);
const locations = JSON.parse(
  readFileSync("public/data/gidb-locations.json", "utf8"),
).locations;

const bounds = outline.bounds;
const polygons = outline.polygons;
const NL_VIEW = { width: 1000, height: 1180, padding: 0.06 };

function projectNl(lat, lon) {
  const { width, height, padding } = NL_VIEW;
  const innerW = width * (1 - padding * 2);
  const innerH = height * (1 - padding * 2);
  const x =
    width * padding +
    ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * innerW;
  const y =
    height * padding +
    (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * innerH;
  return { x, y };
}

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointOnLand(lon, lat) {
  for (const poly of polygons) {
    if (!pointInRing(lon, lat, poly.outer)) continue;
    if (poly.holes.some((hole) => pointInRing(lon, lat, hole))) continue;
    return true;
  }
  return false;
}

/** ~1.5 km tolerance for coastal / simplified border */
const TOLERANCE_DEG = 0.014;

function nearLand(lon, lat) {
  if (pointOnLand(lon, lat)) return true;
  const steps = 8;
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    if (pointOnLand(lon + Math.cos(a) * TOLERANCE_DEG, lat + Math.sin(a) * TOLERANCE_DEG)) {
      return true;
    }
  }
  return false;
}

const offLandStrict = [];
const offLandTolerant = [];
for (const loc of locations) {
  if (!pointOnLand(loc.lon, loc.lat)) offLandStrict.push(loc);
  if (!nearLand(loc.lon, loc.lat)) offLandTolerant.push(loc);
}

console.log(`Locations: ${locations.length}`);
console.log(`Off-land (strict): ${offLandStrict.length}`);
console.log(
  `Off-land (with ${TOLERANCE_DEG}° coastal tolerance): ${offLandTolerant.length}`,
);
const offLand = offLandTolerant;
if (offLand.length > 0) {
  for (const loc of offLand.slice(0, 10)) {
    const p = projectNl(loc.lat, loc.lon);
    console.log(`  - ${loc.title} (${loc.lat}, ${loc.lon}) → ${p.x.toFixed(1)}, ${p.y.toFixed(1)}`);
  }
  process.exit(1);
}
console.log("verify-nl-dots-on-land: OK");

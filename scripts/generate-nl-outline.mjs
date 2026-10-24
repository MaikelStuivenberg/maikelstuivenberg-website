/**
 * Build an accurate Netherlands land outline for the kiosk attract map from
 * CBS province boundaries (WGS84), simplified for bundle size.
 *
 * Usage: node scripts/generate-nl-outline.mjs
 */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const SOURCE_URL =
  "https://cartomap.github.io/nl/wgs84/provincie_2020.geojson";
const MAX_BYTES = 30 * 1024;
const OUT_PATHS = [
  "public/data/nl-outline.json",
  "src/pages/buurt/nl-outline.json",
];

const geojson = await fetch(SOURCE_URL).then((r) => {
  if (!r.ok) throw new Error(`Failed to fetch provinces: ${r.status}`);
  return r.json();
});

function extractPolygons(geometry) {
  const polys = [];
  if (geometry.type === "Polygon") {
    polys.push({
      outer: geometry.coordinates[0],
      holes: geometry.coordinates.slice(1),
    });
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      polys.push({ outer: poly[0], holes: poly.slice(1) });
    }
  }
  return polys;
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const lx = x1 + clamped * dx;
  const ly = y1 + clamped * dy;
  return Math.hypot(px - lx, py - ly);
}

function douglasPeucker(points, epsilon) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i += 1) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, index + 1), epsilon);
    const right = douglasPeucker(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[end]];
}

function closeRing(ring) {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function simplifyRing(ring, epsilon) {
  const closed = closeRing(ring);
  if (closed.length <= 4) return closed;
  const open = closed.slice(0, -1);
  const simplified = douglasPeucker(open, epsilon);
  return closeRing(
    simplified.map(([lon, lat]) => [
      Math.round(lon * 1e5) / 1e5,
      Math.round(lat * 1e5) / 1e5,
    ]),
  );
}

function simplifyPolygons(polygons, epsilon) {
  return polygons.map((poly) => ({
    outer: simplifyRing(poly.outer, epsilon),
    holes: poly.holes.map((hole) => simplifyRing(hole, epsilon)),
  }));
}

let polygons = geojson.features.flatMap((f) => extractPolygons(f.geometry));

let epsilon = 0.00035;
let simplified = simplifyPolygons(polygons, epsilon);
let payload = buildPayload(simplified);

while (JSON.stringify(payload).length > MAX_BYTES && epsilon < 0.02) {
  epsilon *= 1.35;
  simplified = simplifyPolygons(polygons, epsilon);
  payload = buildPayload(simplified);
}

if (JSON.stringify(payload).length > MAX_BYTES) {
  throw new Error(
    `Outline still ${JSON.stringify(payload).length} bytes at epsilon ${epsilon}`,
  );
}

const json = JSON.stringify(payload);
for (const path of OUT_PATHS) {
  writeFileSync(path, json);
}

const points = simplified.reduce(
  (n, p) =>
    n + p.outer.length + p.holes.reduce((h, r) => h + r.length, 0),
  0,
);
console.log(
  `Wrote ${OUT_PATHS.join(", ")} — ${simplified.length} polygons, ${points} vertices, ${json.length} bytes, epsilon=${epsilon.toFixed(5)}`,
);

function buildPayload(polys) {
  const coords = [];
  for (const poly of polys) {
    coords.push(...poly.outer);
    for (const hole of poly.holes) coords.push(...hole);
  }
  const lons = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return {
    source: "CBS provincies 2020 (cartomap.github.io/nl/wgs84/provincie_2020.geojson)",
    bounds: {
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    },
    polygons: polys,
  };
}

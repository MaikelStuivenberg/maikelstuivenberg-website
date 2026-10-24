/**
 * Live PDOK checks for kiosk location search. Run: node scripts/test-pdok-geocode.mjs
 */
import { geocodeDutch } from "../src/pages/buurt/geo.ts";

const CASES = [
  { q: "3511", expectFound: true },
  { q: "3511AB", expectFound: true },
  { q: "3511 ab", expectFound: true },
  { q: "Utrecht", expectFound: true },
  { q: "Zwolle", expectFound: true },
  { q: "9999", expectFound: false },
];

let failed = false;

for (const { q, expectFound } of CASES) {
  const point = await geocodeDutch(q);
  const ok = expectFound ? point !== null : point === null;
  const status = ok ? "OK" : "FAIL";
  if (!ok) failed = true;
  console.log(
    `${status}  "${q}" -> ${point ? `${point.label} (${point.lat.toFixed(4)}, ${point.lon.toFixed(4)})` : "null"}`,
  );
}

if (failed) process.exit(1);
console.log("test-pdok-geocode: all cases passed");

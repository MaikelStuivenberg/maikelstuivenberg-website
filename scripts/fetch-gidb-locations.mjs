/**
 * Fetches Leger des Heils map spots from legerdesheils.nl/locaties
 * and writes public/data/gidb-locations.json for the kiosk.
 */
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const SOURCE_URL = "https://www.legerdesheils.nl/locaties";
const RELEVANT = new Set(["corps", "community-center", "scouting", "youth"]);

function cleanAddress(addr) {
  return addr
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

const html = await fetch(SOURCE_URL).then((r) => r.text());
const match = html.match(/data-geos="([^"]+)"/);
if (!match) {
  throw new Error("Could not find data-geos on locaties page");
}

const geos = JSON.parse(
  match[1]
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\\\//g, "/"),
);

const seen = new Set();
const locations = [];

for (const g of geos) {
  const lat = Number(g.lat);
  const lon = Number(g.lon);
  if (!lat || !lon) continue;
  const address = cleanAddress(g.address ?? "");

  for (const spot of g.spots ?? []) {
    const title = (spot.title ?? "").trim();
    const cats = new Set(spot.categories ?? []);
    const titleL = title.toLowerCase();
    const gidb = titleL.includes("geloven in de buurt");

    const relevant = [...cats].some((c) => RELEVANT.has(c));
    if (!gidb && !relevant) {
      if (cats.size === 1 && cats.has("clothing-store")) continue;
      if (!cats.size) continue;
    }
    if (!gidb && !relevant) continue;

    const key = `${lat.toFixed(5)}|${lon.toFixed(5)}|${titleL}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let kind = "gidb";
    if (cats.has("corps") || titleL.includes("korps")) kind = "korps";
    else if (
      cats.has("community-center") ||
      titleL.includes("buurt") ||
      titleL.includes("huiskamer")
    )
      kind = "buurt";
    else if (cats.has("scouting")) kind = "scouting";
    else if (cats.has("youth")) kind = "jeugd";

    const id = createHash("sha1")
      .update(`${title}|${lat}|${lon}`)
      .digest("hex")
      .slice(0, 12);

    locations.push({
      id,
      title,
      lat,
      lon,
      address,
      categories: [...cats].sort(),
      kind,
      url: spot.url ?? "",
      volunteerUrl: "https://www.legerdesheils.nl/vacatures/vrijwilligerswerk",
    });
  }
}

locations.sort((a, b) => a.title.localeCompare(b.title, "nl"));

const out = {
  generatedAt: new Date().toISOString(),
  source: SOURCE_URL,
  count: locations.length,
  locations,
};

writeFileSync(
  new URL("../public/data/gidb-locations.json", import.meta.url),
  JSON.stringify(out, null, 2),
  "utf8",
);

console.log(`Wrote ${locations.length} locations to public/data/gidb-locations.json`);

import outlineData from "./nl-outline.json";
import type { KioskLocation } from "./types";

export const NL_VIEW = { width: 1000, height: 1180, padding: 0.06 };

type Bounds = {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
};

const bounds = outlineData.bounds as Bounds;
const ring = outlineData.ring as [number, number][];

export function projectNl(
  lat: number,
  lon: number,
  width = NL_VIEW.width,
  height = NL_VIEW.height,
  padding = NL_VIEW.padding,
): { x: number; y: number } {
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

export function netherlandsOutlinePath(
  width = NL_VIEW.width,
  height = NL_VIEW.height,
): string {
  return ring
    .map(([lon, lat], index) => {
      const { x, y } = projectNl(lat, lon, width, height);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ")
    .concat(" Z");
}

export function projectLocations(
  locations: KioskLocation[],
  width = NL_VIEW.width,
  height = NL_VIEW.height,
) {
  return locations.map((loc) => ({
    id: loc.id,
    ...projectNl(loc.lat, loc.lon, width, height),
  }));
}

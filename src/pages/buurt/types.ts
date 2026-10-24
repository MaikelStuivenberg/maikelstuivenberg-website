export type KioskLocation = {
  id: string;
  title: string;
  lat: number;
  lon: number;
  address: string;
  categories: string[];
  kind: string;
  url: string;
  volunteerUrl: string;
};

export type LocationsBundle = {
  generatedAt: string;
  source: string;
  count: number;
  locations: KioskLocation[];
};

export type Screen =
  | "attract"
  | "choose"
  | "search"
  | "map"
  | "signup"
  | "thanks"
  | "admin";

export type MapMode = "all" | "nearby";

export type GeoPoint = { lat: number; lon: number; label: string };

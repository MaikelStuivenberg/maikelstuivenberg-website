import type { KioskEntry } from "./types";

export const KIOSK_ENTRIES_KEY = "gidb-kiosk-entries-v1";
export const KIOSK_ADMIN_PIN = "8247";

export function loadEntries(): KioskEntry[] {
  try {
    const raw = localStorage.getItem(KIOSK_ENTRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KioskEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: KioskEntry): void {
  const entries = loadEntries();
  entries.push(entry);
  localStorage.setItem(KIOSK_ENTRIES_KEY, JSON.stringify(entries));
}

export function entriesToCsv(entries: KioskEntry[]): string {
  const header = [
    "id",
    "createdAt",
    "name",
    "email",
    "consent",
    "locale",
    "placeId",
    "placeTitle",
  ];
  const rows = entries.map((e) =>
    [
      e.id,
      e.createdAt,
      e.name,
      e.email,
      e.consent ? "yes" : "no",
      e.locale,
      e.placeId ?? "",
      e.placeTitle ?? "",
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadCsv(entries: KioskEntry[], filename = "gidb-kiosk-export.csv") {
  const blob = new Blob([entriesToCsv(entries)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

import type { Locale } from "./i18n";

export const KIOSK_OUTBOX_KEY = "gidb-kiosk-outbox-v1";
const LEGACY_ENTRIES_KEY = "gidb-kiosk-entries-v1";
export const KIOSK_ADMIN_PIN = "8247";

export type SignupOutboxEntry = {
  localId: string;
  queuedAt: string;
  name: string;
  email: string;
  consent: boolean;
  language: Locale;
  postcode: string | null;
  source: string;
};

export function clearLegacyEntryStore(): void {
  try {
    localStorage.removeItem(LEGACY_ENTRIES_KEY);
  } catch {
    /* ignore */
  }
}

export function loadOutbox(): SignupOutboxEntry[] {
  try {
    const raw = localStorage.getItem(KIOSK_OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SignupOutboxEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOutbox(entries: SignupOutboxEntry[]): void {
  try {
    localStorage.setItem(KIOSK_OUTBOX_KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode */
  }
}

export function removeOutboxEntry(localId: string): void {
  saveOutbox(loadOutbox().filter((e) => e.localId !== localId));
}

export function outboxToCsv(entries: SignupOutboxEntry[]): string {
  const header = [
    "localId",
    "queuedAt",
    "name",
    "email",
    "consent",
    "language",
    "postcode",
    "source",
  ];
  const rows = entries.map((e) =>
    [
      e.localId,
      e.queuedAt,
      e.name,
      e.email,
      e.consent ? "yes" : "no",
      e.language,
      e.postcode ?? "",
      e.source,
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadOutboxCsv(
  entries: SignupOutboxEntry[],
  filename = "gidb-kiosk-outbox.csv",
) {
  const blob = new Blob([outboxToCsv(entries)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

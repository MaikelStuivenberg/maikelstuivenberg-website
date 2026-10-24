export type KioskRotation = 0 | 90 | 270;

export const KIOSK_ROTATE_STORAGE_KEY = "gidb-kiosk-rotate";

export function parseKioskRotation(value: string | null): KioskRotation | null {
  if (value === "0") return 0;
  if (value === "90") return 90;
  if (value === "270") return 270;
  return null;
}

export function readStoredKioskRotation(): KioskRotation {
  return parseKioskRotation(localStorage.getItem(KIOSK_ROTATE_STORAGE_KEY)) ?? 0;
}

/** Apply `?rotate=` from URL; returns new rotation when param present, else null. */
export function applyKioskRotationFromUrl(): KioskRotation | null {
  const parsed = parseKioskRotation(
    new URLSearchParams(window.location.search).get("rotate"),
  );
  if (parsed === null) return null;
  if (parsed === 0) {
    localStorage.removeItem(KIOSK_ROTATE_STORAGE_KEY);
  } else {
    localStorage.setItem(KIOSK_ROTATE_STORAGE_KEY, String(parsed));
  }
  return parsed;
}

export function persistKioskRotation(rotation: KioskRotation): void {
  if (rotation === 0) {
    localStorage.removeItem(KIOSK_ROTATE_STORAGE_KEY);
  } else {
    localStorage.setItem(KIOSK_ROTATE_STORAGE_KEY, String(rotation));
  }
}

export function syncKioskRotationUrl(rotation: KioskRotation): void {
  const url = new URL(window.location.href);
  if (rotation === 0) {
    url.searchParams.delete("rotate");
  } else {
    url.searchParams.set("rotate", String(rotation));
  }
  window.history.replaceState({}, "", url.toString());
}

export function logicalKioskDimensions(
  rotation: KioskRotation,
  viewportW: number,
  viewportH: number,
): { width: number; height: number } {
  if (rotation === 90 || rotation === 270) {
    return { width: viewportH, height: viewportW };
  }
  return { width: viewportW, height: viewportH };
}

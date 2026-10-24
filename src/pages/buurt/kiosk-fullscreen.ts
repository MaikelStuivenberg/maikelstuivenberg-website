export const KIOSK_AUTO_FULLSCREEN_KEY = "gidb-kiosk-auto-fullscreen";

type FullscreenDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

export function isFullscreenSupported(): boolean {
  const el = document.documentElement as FullscreenElement;
  return Boolean(el.requestFullscreen ?? el.webkitRequestFullscreen);
}

export function isFullscreenActive(): boolean {
  const doc = document as FullscreenDoc;
  return Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

export async function enterFullscreen(): Promise<void> {
  const el = document.documentElement as FullscreenElement;
  if (el.requestFullscreen) {
    await el.requestFullscreen();
    return;
  }
  if (el.webkitRequestFullscreen) {
    await el.webkitRequestFullscreen();
  }
}

export async function exitFullscreen(): Promise<void> {
  const doc = document as FullscreenDoc;
  if (doc.exitFullscreen) {
    await doc.exitFullscreen();
    return;
  }
  if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen();
  }
}

export function readAutoFullscreenEnabled(): boolean {
  try {
    return localStorage.getItem(KIOSK_AUTO_FULLSCREEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function persistAutoFullscreen(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(KIOSK_AUTO_FULLSCREEN_KEY, "1");
    } else {
      localStorage.removeItem(KIOSK_AUTO_FULLSCREEN_KEY);
    }
  } catch {
    /* private mode */
  }
}

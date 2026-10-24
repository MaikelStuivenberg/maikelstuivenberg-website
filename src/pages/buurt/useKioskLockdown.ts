import { useEffect } from "react";

const KIOSK_ROOT = ".buurt-kiosk";
function isInsideKiosk(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(KIOSK_ROOT));
}

/** Kiosk-only UX lockdown: no context menu, selection, drag, or page zoom outside the map. */
export function useKioskLockdown(): void {
  useEffect(() => {
    const root = document.querySelector(KIOSK_ROOT);
    if (!root) return;

    const onContextMenu = (event: Event) => {
      if (!isInsideKiosk(event.target)) return;
      event.preventDefault();
    };

    const onDragStart = (event: Event) => {
      if (!isInsideKiosk(event.target)) return;
      event.preventDefault();
    };

    const syncDraggable = () => {
      root.querySelectorAll("img, a").forEach((el) => {
        if (el instanceof HTMLImageElement || el instanceof HTMLAnchorElement) {
          el.draggable = false;
        }
      });
    };

    syncDraggable();
    const observer = new MutationObserver(syncDraggable);
    observer.observe(root, { childList: true, subtree: true });

    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    root.addEventListener("dragstart", onDragStart, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, { capture: true });
      root.removeEventListener("dragstart", onDragStart, { capture: true });
      observer.disconnect();
    };
  }, []);
}

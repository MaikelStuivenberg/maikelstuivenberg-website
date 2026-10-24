import { useEffect } from "react";
import {
  enterFullscreen,
  isFullscreenActive,
  isFullscreenSupported,
} from "./kiosk-fullscreen";

/** When enabled (admin setting), first tap anywhere enters fullscreen. */
export function useKioskAutoFullscreen(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !isFullscreenSupported()) return;

    const onPointerDown = () => {
      if (!isFullscreenActive()) {
        void enterFullscreen();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
    };
  }, [enabled]);
}

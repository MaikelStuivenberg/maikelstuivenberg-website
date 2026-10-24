import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  enterFullscreen,
  exitFullscreen,
  isFullscreenActive,
  isFullscreenSupported,
} from "./kiosk-fullscreen";

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CompressIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 9H5V5M15 9h4V5M15 15h4v4M9 15H5v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function useFullscreenState(): boolean {
  const [active, setActive] = useState(() => isFullscreenActive());

  useEffect(() => {
    const sync = () => setActive(isFullscreenActive());
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  return active;
}

type Props = {
  showEnterOnAttract: boolean;
  enterLabel: string;
  exitLabel: string;
};

export function KioskFullscreenControls({
  showEnterOnAttract,
  enterLabel,
  exitLabel,
}: Props) {
  const supported = isFullscreenSupported();
  const fullscreen = useFullscreenState();

  const onEnter = useCallback((e: ReactPointerEvent) => {
    e.stopPropagation();
    void enterFullscreen();
  }, []);

  const onExit = useCallback((e: ReactPointerEvent) => {
    e.stopPropagation();
    void exitFullscreen();
  }, []);

  if (!supported) return null;

  if (fullscreen) {
    return (
      <button
        type="button"
        className="kiosk-fullscreen-exit"
        aria-label={exitLabel}
        onPointerDown={(e) => e.preventDefault()}
        onPointerUp={onExit}
      >
        <CompressIcon className="kiosk-fullscreen-exit-icon" />
      </button>
    );
  }

  if (!showEnterOnAttract) return null;

  return (
    <button
      type="button"
      className="kiosk-fullscreen-enter"
      aria-label={enterLabel}
      onPointerDown={(e) => e.preventDefault()}
      onPointerUp={onEnter}
    >
      <ExpandIcon className="kiosk-fullscreen-enter-icon" />
      <span className="kiosk-fullscreen-enter-label">{enterLabel}</span>
    </button>
  );
}

export function useAutoFullscreenOnFirstTap(enabled: boolean): void {
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

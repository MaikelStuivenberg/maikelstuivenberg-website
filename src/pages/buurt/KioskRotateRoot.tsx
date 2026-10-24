import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import {
  applyKioskRotationFromUrl,
  logicalKioskDimensions,
  persistKioskRotation,
  readStoredKioskRotation,
  syncKioskRotationUrl,
  type KioskRotation,
} from "./kiosk-rotation";

type KioskRotationContextValue = {
  rotation: KioskRotation;
  setRotation: (rotation: KioskRotation) => void;
  isRotated: boolean;
};

const KioskRotationContext = createContext<KioskRotationContextValue | null>(
  null,
);

export function useKioskRotation(): KioskRotationContextValue {
  const ctx = useContext(KioskRotationContext);
  if (!ctx) {
    throw new Error("useKioskRotation must be used within KioskRotateRoot");
  }
  return ctx;
}

function useViewportSize() {
  const [size, setSize] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }));

  useEffect(() => {
    const onResize = () => {
      setSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}

export function KioskRotateRoot({ children }: { children: ReactNode }) {
  const [rotation, setRotationState] = useState<KioskRotation>(() => {
    const fromUrl = applyKioskRotationFromUrl();
    if (fromUrl !== null) return fromUrl;
    return readStoredKioskRotation();
  });
  const viewport = useViewportSize();
  const stageRef = useRef<HTMLDivElement>(null);

  const setRotation = useCallback((next: KioskRotation) => {
    setRotationState(next);
    persistKioskRotation(next);
    syncKioskRotationUrl(next);
  }, []);

  const logical = useMemo(
    () => logicalKioskDimensions(rotation, viewport.w, viewport.h),
    [rotation, viewport.w, viewport.h],
  );

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty("--app-w", `${logical.width}px`);
    el.style.setProperty("--app-h", `${logical.height}px`);
  }, [logical.width, logical.height]);

  const value = useMemo(
    () => ({
      rotation,
      setRotation,
      isRotated: rotation !== 0,
    }),
    [rotation, setRotation],
  );

  return (
    <KioskRotationContext.Provider value={value}>
      <div className="kiosk-rotate-viewport" aria-hidden={false}>
        <div
          ref={stageRef}
          className={cn(
            "kiosk-rotate-stage",
            rotation === 90 && "kiosk-rotate-stage--90",
            rotation === 270 && "kiosk-rotate-stage--270",
          )}
        >
          {children}
        </div>
      </div>
    </KioskRotationContext.Provider>
  );
}

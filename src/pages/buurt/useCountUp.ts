import { useEffect, useState } from "react";

export function useCountUp(
  target: number,
  resetKey: number,
  durationMs = 900,
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(target) || target < 0) {
      setValue(0);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }

    let raf = 0;
    const startAt = performance.now();
    setValue(0);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startAt) / durationMs);
      setValue(Math.round(target * progress));
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [target, resetKey, durationMs]);

  return value;
}

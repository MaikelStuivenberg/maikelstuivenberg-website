import { useLayoutEffect, useState } from "react";

/**
 * Count display for attract screen. Never animates through 0 when target > 0.
 * Returns null while target is unknown (parent shows "…").
 */
export function useCountUp(
  target: number | null,
  resetKey: number,
  durationMs = 900,
): number | null {
  const [value, setValue] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (target === null || !Number.isFinite(target)) {
      setValue(null);
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced || typeof window.requestAnimationFrame !== "function") {
      setValue(target);
      return;
    }

    const startValue = Math.max(
      1,
      target - Math.min(12, Math.floor(target * 0.35)),
    );
    if (startValue >= target) {
      setValue(target);
      return;
    }

    setValue(startValue);
    let raf = 0;
    const startAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startAt) / durationMs);
      const next = Math.max(
        startValue,
        Math.min(
          target,
          Math.round(startValue + (target - startValue) * progress),
        ),
      );
      setValue(next);
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [target, resetKey, durationMs]);

  return value;
}

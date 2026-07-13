import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Phase = "intro" | "expand" | "full" | "collapse";

const PHASE_DURATIONS: Record<Phase, number> = {
  intro: 1800,
  expand: 1200,
  full: 4000,
  collapse: 900,
};

const NEXT_PHASE: Record<Phase, Phase> = {
  intro: "expand",
  expand: "full",
  full: "collapse",
  collapse: "intro",
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

const headingClassName =
  "brand-reveal animate-fade-up max-w-[14ch] text-center text-[clamp(3rem,11vw,7.5rem)] font-medium leading-[0.92] tracking-[-0.035em] text-balance";

function DualGlyph({
  lower,
  upper,
  expanded,
}: Readonly<{ lower: string; upper: string; expanded: boolean }>) {
  return (
    <span className="brand-letter brand-letter--anchor brand-letter--dual">
      <span className={cn("brand-glyph", expanded && "brand-glyph--on")}>{lower}</span>
      <span className={cn("brand-glyph", !expanded && "brand-glyph--on")}>{upper}</span>
    </span>
  );
}

function BrandLetters({ expanded }: Readonly<{ expanded: boolean }>) {
  return (
    <span className="brand-line" aria-hidden="true">
      <span className="brand-letter brand-letter--anchor">M</span>
      <span
        className={cn("brand-letter brand-letter--hidden", expanded && "brand-letter--visible")}
      >
        a
      </span>
      <span
        className={cn(
          "brand-letter brand-letter--hidden brand-letter--stagger-1",
          expanded && "brand-letter--visible",
        )}
      >
        i
      </span>
      <DualGlyph lower="k" upper="K" expanded={expanded} />
      <span
        className={cn(
          "brand-letter brand-letter--hidden brand-letter--stagger-2",
          expanded && "brand-letter--visible",
        )}
      >
        e
      </span>
      <DualGlyph lower="l" upper="L" expanded={expanded} />
    </span>
  );
}

function BrandSubtitle({ expanded }: Readonly<{ expanded: boolean }>) {
  return (
    <span className="brand-subline" aria-hidden="true">
      <span className={cn("brand-subline-text", !expanded && "brand-subline-text--visible")}>
        Studio
      </span>
      <span className={cn("brand-subline-text", expanded && "brand-subline-text--visible")}>
        Stuivenberg
      </span>
    </span>
  );
}

export function BrandReveal() {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("intro");
  const [hovered, setHovered] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const expanded = phase === "expand" || phase === "full";

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (reducedMotion || hovered || tabHidden) return;

    timerRef.current = setTimeout(() => {
      setPhase((current) => NEXT_PHASE[current]);
    }, PHASE_DURATIONS[phase]);

    return () => clearTimeout(timerRef.current);
  }, [phase, hovered, tabHidden, reducedMotion]);

  if (reducedMotion) {
    return (
      <h1 className={headingClassName} aria-label="Maikel Stuivenberg, MKL Studio">
        <BrandLetters expanded />
        <BrandSubtitle expanded />
      </h1>
    );
  }

  return (
    <h1
      className={cn(headingClassName, phase === "collapse" && "brand-reveal--collapsing")}
      aria-label="Maikel Stuivenberg, MKL Studio"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <BrandLetters expanded={expanded} />
      <BrandSubtitle expanded={expanded} />
    </h1>
  );
}

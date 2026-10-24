import { useEffect, useMemo, useState } from "react";
import type { KioskLocation } from "./types";
import {
  netherlandsOutlinePath,
  NL_VIEW,
  projectLocations,
} from "./nl-map";

type Props = {
  questions: string[];
  questionIndex: number;
  tagline: string;
  cta: string;
  placesCountLabel: string;
  locations: KioskLocation[];
  onStart: () => void;
};

function TouchFingerIcon() {
  return (
    <svg
      className="kiosk-attract-cta-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path
        d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"
      />
    </svg>
  );
}

export function AttractScreen({
  questions,
  questionIndex,
  tagline,
  cta,
  placesCountLabel,
  locations,
  onStart,
}: Props) {
  const question = questions[questionIndex];
  const outlinePath = useMemo(() => netherlandsOutlinePath(), []);
  const dots = useMemo(() => projectLocations(locations), [locations]);
  const [spotlight, setSpotlight] = useState(0);

  useEffect(() => {
    if (dots.length === 0) return;
    const id = window.setInterval(() => {
      setSpotlight((s) => (s + 1) % dots.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [dots.length]);

  const spotlightIds = useMemo(() => {
    if (dots.length === 0) return new Set<string>();
    const ids = new Set<string>();
    for (let offset = -1; offset <= 1; offset += 1) {
      const idx = (spotlight + offset + dots.length) % dots.length;
      ids.add(dots[idx].id);
    }
    return ids;
  }, [dots, spotlight]);

  return (
    <button
      type="button"
      className="kiosk-attract flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl text-center shadow-inner"
      onClick={onStart}
    >
      <div className="kiosk-attract-gradient" aria-hidden="true" />
      <div className="kiosk-attract-lines" aria-hidden="true" />

      <div className="kiosk-attract-map-panel" aria-hidden="true">
        <svg
          className="kiosk-attract-map-svg"
          viewBox={`0 0 ${NL_VIEW.width} ${NL_VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <path className="kiosk-attract-map-fill" d={outlinePath} />
          <path className="kiosk-attract-map-stroke" d={outlinePath} />
          {dots.map((dot) => {
            const active = spotlightIds.has(dot.id);
            return (
              <circle
                key={dot.id}
                cx={dot.x}
                cy={dot.y}
                r={active ? 9 : 4.5}
                className={
                  active ? "kiosk-attract-dot kiosk-attract-dot--spot" : "kiosk-attract-dot"
                }
              />
            );
          })}
        </svg>
      </div>

      <div className="kiosk-attract-copy">
        <p key={questionIndex} className="kiosk-attract-question">
          {question}
        </p>
        <p className="kiosk-attract-tagline">{tagline}</p>
        <p className="kiosk-attract-count">{placesCountLabel}</p>
        <div className="kiosk-attract-cta">
          <TouchFingerIcon />
          <span>{cta}</span>
        </div>
      </div>
    </button>
  );
}

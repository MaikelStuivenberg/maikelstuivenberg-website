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
  lunchPromoLabel: string;
  placesCount: number | string;
  placesCountTemplate: string;
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

function PlacesCountStat({
  count,
  template,
}: {
  count: number | string;
  template: string;
}) {
  const suffix = template.replace("{count}", "").trimStart();
  return (
    <p className="kiosk-attract-count">
      <span className="kiosk-attract-count-num">{count}</span>
      {suffix ? (
        <span className="kiosk-attract-count-label">{suffix}</span>
      ) : null}
    </p>
  );
}

export function AttractScreen({
  questions,
  questionIndex,
  tagline,
  cta,
  lunchPromoLabel,
  placesCount,
  placesCountTemplate,
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
    }, 1600);
    return () => window.clearInterval(id);
  }, [dots.length]);

  const rippleDots = useMemo(() => {
    if (dots.length === 0) return new Map<string, number>();
    const map = new Map<string, number>();
    const count = Math.min(5, dots.length);
    for (let i = 0; i < count; i += 1) {
      const idx = (spotlight + i) % dots.length;
      map.set(dots[idx].id, i);
    }
    return map;
  }, [dots, spotlight]);

  return (
    <div
      className="kiosk-attract kiosk-surface h-full min-h-0 flex-1 overflow-hidden text-center"
    >
      <button
        type="button"
        className="kiosk-attract-hero-tap"
        onClick={onStart}
        aria-label={cta}
      >
        <div className="kiosk-attract-ambient" aria-hidden="true">
          <div className="kiosk-attract-glow kiosk-attract-glow--red" />
          <div className="kiosk-attract-glow kiosk-attract-glow--teal" />
          <div className="kiosk-attract-stripes" />
        </div>

        <div className="kiosk-attract-map-panel" aria-hidden="true">
          <svg
            className="kiosk-attract-map-svg"
            viewBox={`0 0 ${NL_VIEW.width} ${NL_VIEW.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter
                id="kiosk-map-soft-shadow"
                x="-8%"
                y="-8%"
                width="116%"
                height="116%"
              >
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="10"
                  floodColor="#072329"
                  floodOpacity="0.08"
                />
              </filter>
            </defs>
            <path
              className="kiosk-attract-map-fill"
              fillRule="evenodd"
              filter="url(#kiosk-map-soft-shadow)"
              d={outlinePath}
            />
            <path className="kiosk-attract-map-stroke" d={outlinePath} />
            {dots.map((dot) => {
              const rippleIndex = rippleDots.get(dot.id);
              const rippling = rippleIndex !== undefined;
              return (
                <g key={dot.id}>
                  {rippling ? (
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={7}
                      className="kiosk-attract-dot-ring"
                      style={{ animationDelay: `${rippleIndex * 0.18}s` }}
                    />
                  ) : null}
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={rippling ? 6.5 : 5.5}
                    className={
                      rippling
                        ? "kiosk-attract-dot kiosk-attract-dot--ripple"
                        : "kiosk-attract-dot"
                    }
                    style={
                      rippling
                        ? { animationDelay: `${rippleIndex * 0.18}s` }
                        : undefined
                    }
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="kiosk-attract-hero-copy">
          <p key={questionIndex} className="kiosk-attract-question">
            {question}
          </p>
          <p className="kiosk-attract-tagline">
            <span className="kiosk-attract-tagline-text">{tagline}</span>
          </p>
          <PlacesCountStat
            count={placesCount}
            template={placesCountTemplate}
          />
        </div>
      </button>

      <div className="kiosk-attract-actions">
        <p className="kiosk-attract-lunch-promo">{lunchPromoLabel}</p>
        <button type="button" className="kiosk-attract-cta" onClick={onStart}>
          <TouchFingerIcon />
          <span>{cta}</span>
        </button>
      </div>
    </div>
  );
}

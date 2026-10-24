import { useEffect, useMemo, useState } from "react";
import type { KioskLocation } from "./types";
import {
  netherlandsOutlinePath,
  NL_VIEW,
  projectLocations,
} from "./nl-map";
import { AttractLunchPromo } from "./AttractLunchPromo";
import { isSoulStation } from "./soul-station";
import { useCountUp } from "./useCountUp";

type Props = {
  questions: string[];
  questionIndex: number;
  tagline: string;
  cta: string;
  lunchTapeLabel: string;
  lunchHeadline1: string;
  lunchHeadline2Prefix: string;
  soulStationName: string;
  lunchFinePrint: string;
  placesCount: number | string;
  placesCountTemplate: string;
  locations: KioskLocation[];
  onStart: () => void;
  onLunchPromo: () => void;
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

function MapPlacesCounter({
  count,
  template,
  cycleKey,
}: {
  count: number | string;
  template: string;
  cycleKey: number;
}) {
  const numeric =
    typeof count === "number" && Number.isFinite(count) && count > 0
      ? count
      : null;
  const animated = useCountUp(numeric, cycleKey);
  const display =
    numeric === null
      ? typeof count === "string"
        ? count
        : "…"
      : (animated ?? numeric);
  const suffix = template.replace("{count}", "").trimStart();

  return (
    <div className="kiosk-attract-map-counter" aria-live="polite">
      <div className="kiosk-attract-map-counter-align">
        <div className="kiosk-attract-map-counter-card">
          <p className="kiosk-attract-map-counter-num">{display}</p>
          {suffix ? (
            <p className="kiosk-attract-map-counter-label">{suffix}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AttractScreen({
  questions,
  questionIndex,
  tagline,
  cta,
  lunchTapeLabel,
  lunchHeadline1,
  lunchHeadline2Prefix,
  soulStationName,
  lunchFinePrint,
  placesCount,
  placesCountTemplate,
  locations,
  onStart,
  onLunchPromo,
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

  const rippleDots = useMemo(() => {
    if (dots.length === 0) return new Map<string, number>();
    const map = new Map<string, number>();
    const count = Math.min(8, dots.length);
    for (let i = 0; i < count; i += 1) {
      const idx = (spotlight + i) % dots.length;
      map.set(dots[idx].id, i);
    }
    return map;
  }, [dots, spotlight]);

  const countCycleKey =
    typeof placesCount === "number" ? placesCount * 1000 + questionIndex : 0;

  return (
    <div
      className="kiosk-attract kiosk-surface h-full min-h-0 flex-1 overflow-hidden text-center"
    >
      <div className="kiosk-attract-ambient" aria-hidden="true">
        <div className="kiosk-attract-glow kiosk-attract-glow--red" />
        <div className="kiosk-attract-glow kiosk-attract-glow--teal" />
        <div className="kiosk-attract-stripes" />
      </div>

      <header className="kiosk-attract-headline">
        <p key={questionIndex} className="kiosk-attract-question">
          {question}
        </p>
        <p className="kiosk-attract-tagline">
          <span className="kiosk-attract-tagline-text">{tagline}</span>
        </p>
      </header>

      <div className="kiosk-attract-stage">
        <div className="kiosk-attract-map-panel" aria-hidden="true">
          <div className="kiosk-attract-map-center">
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
            {dots.map((dot, dotIndex) => {
              const rippleIndex = rippleDots.get(dot.id);
              const rippling = rippleIndex !== undefined;
              const featured = isSoulStation(dot.id);
              const idleDelay = `${(dotIndex % 7) * 0.22}s`;
              return (
                  <g key={dot.id}>
                    {featured ? (
                      <circle
                        cx={dot.x}
                        cy={dot.y}
                        r={10}
                        className="kiosk-attract-dot-feature-ring"
                      />
                    ) : null}
                    {rippling ? (
                      <circle
                        cx={dot.x}
                        cy={dot.y}
                        r={7}
                        className="kiosk-attract-dot-ring"
                        style={{ animationDelay: `${rippleIndex * 0.15}s` }}
                      />
                    ) : null}
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={rippling ? 6.5 : 5.5}
                      className={
                        rippling
                          ? "kiosk-attract-dot kiosk-attract-dot--ripple"
                          : featured
                            ? "kiosk-attract-dot kiosk-attract-dot--featured kiosk-attract-dot--idle"
                            : "kiosk-attract-dot kiosk-attract-dot--idle"
                      }
                      style={
                        rippling
                          ? { animationDelay: `${rippleIndex * 0.15}s` }
                          : { animationDelay: idleDelay }
                      }
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          <MapPlacesCounter
            count={placesCount}
            template={placesCountTemplate}
            cycleKey={countCycleKey}
          />
        </div>

        <div className="kiosk-attract-lunch-wrap">
          <div className="kiosk-attract-lunch-card">
            <AttractLunchPromo
              tapeLabel={lunchTapeLabel}
              headlineLine1={lunchHeadline1}
              headlineLine2Prefix={lunchHeadline2Prefix}
              soulStationName={soulStationName}
              finePrint={lunchFinePrint}
              onActivate={onLunchPromo}
            />
          </div>
        </div>
      </div>

      <div className="kiosk-attract-actions">
        <button
          type="button"
          className="kiosk-attract-cta kiosk-attract-cta--pulse"
          onClick={onStart}
        >
          <TouchFingerIcon />
          <span>{cta}</span>
        </button>
      </div>
    </div>
  );
}

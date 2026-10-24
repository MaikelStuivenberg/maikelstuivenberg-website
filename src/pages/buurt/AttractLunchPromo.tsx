type Props = {
  tapeLabel: string;
  headlineLine1: string;
  headlineLine2Prefix: string;
  soulStationName: string;
  finePrint: string;
  onActivate: () => void;
};

function LunchFlourish() {
  return (
    <svg
      className="kiosk-lunch-flourish"
      viewBox="0 0 48 28"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 4c8 10 18 14 32 12"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M34 8l6 6-8 2"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AttractLunchPromo({
  tapeLabel,
  headlineLine1,
  headlineLine2Prefix,
  soulStationName,
  finePrint,
  onActivate,
}: Props) {
  return (
    <button
      type="button"
      className="kiosk-lunch-lockup"
      aria-label={`${headlineLine1} ${headlineLine2Prefix}${soulStationName}`}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
    >
      <span className="kiosk-lunch-tape">{tapeLabel}</span>
      <span className="kiosk-lunch-headline">
        <span className="kiosk-lunch-headline-line">{headlineLine1}</span>
        <span className="kiosk-lunch-headline-line">
          {headlineLine2Prefix}
          <span className="kiosk-soul-station-mark">{soulStationName}</span>
        </span>
      </span>
      <span className="kiosk-lunch-fine">{finePrint}</span>
      <LunchFlourish />
    </button>
  );
}

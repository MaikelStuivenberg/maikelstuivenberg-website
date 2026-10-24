type Props = {
  tapeLabel: string;
  headlineLine1: string;
  headlineLine2Prefix: string;
  soulStationName: string;
  finePrint: string;
  onActivate: () => void;
};

export function AttractLunchPromo({
  tapeLabel,
  headlineLine1,
  headlineLine2Prefix,
  soulStationName,
  finePrint,
  onActivate,
}: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="kiosk-lunch-lockup"
      aria-label={`${headlineLine1} ${headlineLine2Prefix}${soulStationName}`}
      onClick={() => onActivate()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
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
    </div>
  );
}

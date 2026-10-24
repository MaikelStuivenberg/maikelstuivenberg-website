import { NewSticker } from "./NewSticker";

type Props = {
  line1: string;
  line2Before: string;
  soulStationName: string;
  line2After: string;
  newLabel: string;
  onActivate: () => void;
};

export function AttractLunchPromo({
  line1,
  line2Before,
  soulStationName,
  line2After,
  newLabel,
  onActivate,
}: Props) {
  return (
    <button
      type="button"
      className="kiosk-attract-lunch-promo-tap"
      aria-label={line1}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
    >
      <span className="kiosk-attract-lunch-promo-line">{line1}</span>
      <span className="kiosk-attract-lunch-promo-sub">
        {line2Before}
        <span className="kiosk-attract-lunch-promo-soul-wrap">
          <span className="kiosk-soul-station-mark">{soulStationName}</span>
          <NewSticker
            label={newLabel}
            className="kiosk-attract-lunch-promo-sticker"
          />
        </span>
        {line2After}
      </span>
    </button>
  );
}

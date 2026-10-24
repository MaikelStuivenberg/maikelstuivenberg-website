import { LocationNameWithBadge } from "./LocationNameWithBadge";
import { MapSheetQr } from "./MapSheetQr";
import type { KioskLocation } from "./types";

type Props = {
  location: KioskLocation;
  newLabel: string;
  placeJoinLabel: string;
  qrHint: string;
  closeLabel: string;
  helpCta: string;
  onClose: () => void;
  onHelp: () => void;
};

export function LocationMapSheet({
  location,
  newLabel,
  placeJoinLabel,
  qrHint,
  closeLabel,
  helpCta,
  onClose,
  onHelp,
}: Props) {
  const qrTarget = location.url || "https://gidb.legerdesheils.nl";

  return (
    <div className="kiosk-map-sheet" role="region" aria-label={location.title}>
      <button
        type="button"
        className="kiosk-map-sheet-close"
        onClick={onClose}
        aria-label={closeLabel}
      >
        ×
      </button>
      <div className="kiosk-map-sheet-layout">
        <div className="kiosk-map-sheet-main">
          <p className="kiosk-map-sheet-kicker">{placeJoinLabel}</p>
          <p className="kiosk-map-sheet-title">
            <LocationNameWithBadge
              locationId={location.id}
              title={location.title}
              newLabel={newLabel}
            />
          </p>
          <p className="kiosk-map-sheet-address">{location.address}</p>
          <button
            type="button"
            className="kiosk-touch-btn kiosk-btn-primary kiosk-map-sheet-cta"
            onClick={onHelp}
          >
            {helpCta}
          </button>
        </div>
        <div className="kiosk-map-sheet-qr">
          <MapSheetQr
            target={qrTarget}
            sizePx={180}
            className="kiosk-map-sheet-qr-img"
          />
          <p className="kiosk-map-sheet-qr-hint">{qrHint}</p>
        </div>
      </div>
    </div>
  );
}

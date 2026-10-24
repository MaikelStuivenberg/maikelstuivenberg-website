import { LocationNameWithBadge } from "./LocationNameWithBadge";
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

function qrImageUrl(data: string, px: number): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&margin=8&data=${encodeURIComponent(data)}`;
}

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
      <div className="kiosk-map-sheet-body">
        <div className="kiosk-map-sheet-copy">
          <p className="kiosk-map-sheet-kicker">{placeJoinLabel}</p>
          <p className="kiosk-map-sheet-title">
            <LocationNameWithBadge
              locationId={location.id}
              title={location.title}
              newLabel={newLabel}
            />
          </p>
          <p className="kiosk-map-sheet-address">{location.address}</p>
        </div>
        <div className="kiosk-map-sheet-qr">
          <img
            className="kiosk-map-sheet-qr-img"
            src={qrImageUrl(qrTarget, 180)}
            width={180}
            height={180}
            alt=""
          />
          <p className="kiosk-map-sheet-qr-hint">{qrHint}</p>
        </div>
      </div>
      <button type="button" className="kiosk-touch-btn kiosk-btn-primary kiosk-map-sheet-cta" onClick={onHelp}>
        {helpCta}
      </button>
    </div>
  );
}

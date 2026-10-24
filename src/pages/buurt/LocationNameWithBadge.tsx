import { cn } from "@/lib/utils";
import { NewSticker } from "./NewSticker";
import { isSoulStation } from "./soul-station";

type Props = {
  locationId: string;
  title: string;
  newLabel: string;
  className?: string;
  badgeClassName?: string;
};

export function LocationNameWithBadge({
  locationId,
  title,
  newLabel,
  className,
  badgeClassName,
}: Props) {
  const showNew = isSoulStation(locationId);
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5", className)}>
      <span className={showNew ? "kiosk-soul-station-mark" : undefined}>{title}</span>
      {showNew ? (
        <NewSticker
          label={newLabel}
          className={cn("kiosk-location-new-sticker", badgeClassName)}
        />
      ) : null}
    </span>
  );
}

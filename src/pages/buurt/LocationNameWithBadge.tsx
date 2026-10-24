import { cn } from "@/lib/utils";
import { isSoulStation } from "./soul-station";

type Props = {
  locationId: string;
  title: string;
  newLabel: string;
  className?: string;
};

export function LocationNameWithBadge({
  locationId,
  title,
  newLabel,
  className,
}: Props) {
  const showNew = isSoulStation(locationId);
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5", className)}>
      <span>{title}</span>
      {showNew ? (
        <span className="kiosk-location-new-tag">{newLabel}</span>
      ) : null}
    </span>
  );
}

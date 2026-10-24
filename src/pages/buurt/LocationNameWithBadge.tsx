import { cn } from "@/lib/utils";
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
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-0.5", className)}>
      <span>{title}</span>
      {showNew ? (
        <span className={cn("kiosk-location-new-badge", badgeClassName)}>
          {newLabel}
        </span>
      ) : null}
    </span>
  );
}

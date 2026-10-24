import { cn } from "@/lib/utils";

type Props = {
  label: string;
  className?: string;
};

/** Small rotated “NIEUW” / “NEW” sticker (Soul Station). */
export function NewSticker({ label, className }: Props) {
  return (
    <span className={cn("kiosk-new-sticker", className)} aria-hidden="true">
      {label}
    </span>
  );
}

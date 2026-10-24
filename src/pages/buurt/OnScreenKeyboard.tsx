import { cn } from "@/lib/utils";

export type KeyboardMode = "location" | "email" | "text" | "pin";

type Props = {
  mode: KeyboardMode;
  onKey: (key: string) => void;
  onBackspace: () => void;
  onEnter?: () => void;
  className?: string;
};

const ROWS_LOCATION = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", "-", " "],
];

const ROWS_EMAIL = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", "@", "."],
];

const ROWS_PIN = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", ""],
];

function KeyButton({
  label,
  wide,
  onPress,
}: {
  label: string;
  wide?: boolean;
  onPress: () => void;
}) {
  if (!label) {
    return <div className={cn(wide ? "col-span-2" : "", "min-h-14")} />;
  }
  return (
    <button
      type="button"
      onPointerDown={(e) => e.preventDefault()}
      onClick={onPress}
      className={cn(
        "min-h-[3.75rem] rounded-xl bg-white/95 text-2xl font-semibold text-[var(--kiosk-navy)] shadow-sm active:scale-95 active:bg-[var(--kiosk-mint)]",
        wide && "col-span-2",
      )}
    >
      {label}
    </button>
  );
}

export function OnScreenKeyboard({
  mode,
  onKey,
  onBackspace,
  onEnter,
  className,
}: Props) {
  const rows =
    mode === "pin"
      ? ROWS_PIN
      : mode === "email"
        ? ROWS_EMAIL
        : ROWS_LOCATION;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-10 gap-1.5 sm:gap-2"
          style={mode === "pin" ? { gridTemplateColumns: "repeat(3, 1fr)" } : undefined}
        >
          {row.map((key) => (
            <KeyButton
              key={`${i}-${key || "empty"}`}
              label={key}
              onPress={() => key && onKey(key === " " ? " " : key)}
            />
          ))}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={onBackspace}
          className="min-h-[3.75rem] rounded-xl bg-[var(--kiosk-navy)] text-xl font-semibold text-white active:opacity-90"
        >
          ⌫
        </button>
        {onEnter ? (
          <button
            type="button"
            onPointerDown={(e) => e.preventDefault()}
            onClick={onEnter}
            className="min-h-[3.75rem] rounded-xl bg-[var(--kiosk-red)] text-xl font-bold text-white active:opacity-90"
          >
            OK
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

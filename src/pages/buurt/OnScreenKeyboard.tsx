import { cn } from "@/lib/utils";

export type KeyboardMode = "location" | "email" | "name" | "pin";

type Props = {
  mode: KeyboardMode;
  onKey: (key: string) => void;
  onBackspace: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  className?: string;
};

const ROWS_LOCATION = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", "-", " "],
];

const ROWS_NAME = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "'"],
  ["z", "x", "c", "v", "b", "n", "m", "-", " "],
];

const ROWS_EMAIL_LETTERS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const ROWS_EMAIL_SYMBOLS = ["@", ".", "-", "_", "+"];

const EMAIL_SNIPPETS = [
  "@gmail.com",
  "@hotmail.com",
  "@outlook.com",
  ".com",
  ".nl",
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
  small,
  onPress,
}: {
  label: string;
  wide?: boolean;
  small?: boolean;
  onPress: () => void;
}) {
  if (!label) {
    return <div className={cn(wide ? "col-span-2" : "", "min-h-14")} />;
  }
  return (
    <button
      type="button"
      onPointerDown={(e) => e.preventDefault()}
      onPointerUp={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={cn(
        "kiosk-key rounded-xl bg-white/95 font-semibold text-[var(--kiosk-navy)] shadow-sm active:scale-95 active:bg-[var(--kiosk-mint)]",
        small ? "min-h-[3rem] text-lg" : "min-h-[3.75rem] text-2xl",
        wide && "col-span-2",
      )}
    >
      {label}
    </button>
  );
}

function SnippetButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.preventDefault()}
      onPointerUp={(e) => {
        e.preventDefault();
        onPress();
      }}
      className="min-h-[3rem] flex-1 rounded-xl bg-[var(--kiosk-mint)]/50 px-2 text-lg font-bold text-[var(--kiosk-navy)] active:bg-[var(--kiosk-mint)]"
    >
      {label}
    </button>
  );
}

export function SearchIcon() {
  return (
    <svg
      className="h-8 w-8 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LetterRows({
  rows,
  onKey,
}: {
  rows: string[][];
  onKey: (key: string) => void;
}) {
  return (
    <>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-10 gap-1.5 sm:gap-2">
          {row.map((key) => (
            <KeyButton
              key={`${i}-${key}`}
              label={key}
              onPress={() => onKey(key === " " ? " " : key)}
            />
          ))}
        </div>
      ))}
    </>
  );
}

export function OnScreenKeyboard({
  mode,
  onKey,
  onBackspace,
  onSubmit,
  submitLabel,
  className,
}: Props) {
  const showSubmit = Boolean(onSubmit && submitLabel);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {mode === "email" && (
        <>
          <div className="flex flex-wrap gap-2">
            {EMAIL_SNIPPETS.map((snippet) => (
              <SnippetButton
                key={snippet}
                label={snippet}
                onPress={() => onKey(snippet)}
              />
            ))}
          </div>
          <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => (
              <KeyButton key={d} label={d} onPress={() => onKey(d)} />
            ))}
          </div>
          <LetterRows rows={ROWS_EMAIL_LETTERS} onKey={onKey} />
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {ROWS_EMAIL_SYMBOLS.map((sym) => (
              <KeyButton key={sym} label={sym} onPress={() => onKey(sym)} />
            ))}
          </div>
        </>
      )}

      {mode === "name" && <LetterRows rows={ROWS_NAME} onKey={onKey} />}

      {mode === "location" && (
        <LetterRows rows={ROWS_LOCATION} onKey={onKey} />
      )}

      {mode === "pin" &&
        ROWS_PIN.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-3 gap-2"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            {row.map((key) => (
              <KeyButton
                key={`${i}-${key || "empty"}`}
                label={key}
                onPress={() => key && onKey(key)}
              />
            ))}
          </div>
        ))}

      {mode !== "pin" && (
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onPointerUp={(e) => {
            e.preventDefault();
            onBackspace();
          }}
          className="min-h-[3.75rem] rounded-xl bg-[var(--kiosk-navy)] text-xl font-semibold text-white active:opacity-90"
        >
          ⌫
        </button>
      )}

      {mode === "pin" && (
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onPointerUp={(e) => {
            e.preventDefault();
            onBackspace();
          }}
          className="min-h-[3.75rem] rounded-xl bg-[var(--kiosk-navy)] text-xl font-semibold text-white active:opacity-90"
        >
          ⌫
        </button>
      )}

      {showSubmit ? (
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSubmit!();
          }}
          className="flex min-h-[4.25rem] w-full items-center justify-center gap-3 rounded-2xl bg-[var(--kiosk-red)] text-2xl font-extrabold text-white shadow-lg active:scale-[0.99]"
        >
          <SearchIcon />
          <span>{submitLabel}</span>
        </button>
      ) : null}
    </div>
  );
}

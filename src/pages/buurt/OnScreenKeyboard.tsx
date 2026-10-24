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
    return (
      <div
        className={cn(wide ? "col-span-2" : "", "min-h-[2.5rem]")}
        aria-hidden="true"
      />
    );
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
        "kiosk-key font-semibold text-[var(--kiosk-navy)]",
        small ? "kiosk-key--small" : "",
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
      className="kiosk-key-snippet kiosk-key font-semibold text-[var(--kiosk-navy)]"
    >
      {label}
    </button>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("kiosk-key-submit-icon shrink-0", className)}
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
        <div key={i} className="kiosk-key-row grid grid-cols-10">
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
    <div className={cn("kiosk-keyboard flex flex-col", className)}>
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
          <div className="kiosk-key-row grid grid-cols-10">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => (
              <KeyButton key={d} label={d} onPress={() => onKey(d)} />
            ))}
          </div>
          <LetterRows rows={ROWS_EMAIL_LETTERS} onKey={onKey} />
          <div className="kiosk-key-row grid grid-cols-5">
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
            className="kiosk-key-row grid grid-cols-3"
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

      <button
        type="button"
        onPointerDown={(e) => e.preventDefault()}
        onPointerUp={(e) => {
          e.preventDefault();
          onBackspace();
        }}
        className="kiosk-key-backspace kiosk-key kiosk-key--dark font-semibold"
      >
        ⌫
      </button>

      {showSubmit ? (
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSubmit!();
          }}
          className="kiosk-key-submit kiosk-btn-primary flex w-full items-center justify-center font-extrabold"
        >
          <SearchIcon />
          <span>{submitLabel}</span>
        </button>
      ) : null}
    </div>
  );
}

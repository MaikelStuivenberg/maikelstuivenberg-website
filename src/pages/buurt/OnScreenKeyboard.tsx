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

const ROWS_NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const ROWS_Q = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const ROWS_A = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const ROWS_Z = ["Z", "X", "C", "V", "B", "N", "M"];

const ROWS_NAME_Q = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const ROWS_NAME_A = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const ROWS_NAME_Z = ["z", "x", "c", "v", "b", "n", "m"];

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

function BackspaceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5-4V6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13 10l4 4m0-4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CharKey({
  label,
  onPress,
  className,
}: {
  label: string;
  onPress: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.preventDefault()}
      onPointerUp={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={cn("kiosk-key font-semibold text-[var(--kiosk-navy)]", className)}
    >
      {label}
    </button>
  );
}

function BackspaceKey({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      aria-label="Wis laatste teken"
      onPointerDown={(e) => e.preventDefault()}
      onPointerUp={(e) => {
        e.preventDefault();
        onPress();
      }}
      className="kiosk-key kiosk-key--backspace font-semibold text-[var(--kiosk-navy)]"
    >
      <BackspaceIcon className="kiosk-key-backspace-icon" />
    </button>
  );
}

function SpaceKey({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      aria-label="Space"
      onPointerDown={(e) => e.preventDefault()}
      onPointerUp={(e) => {
        e.preventDefault();
        onPress();
      }}
      className="kiosk-key kiosk-key--space"
    >
      <span className="kiosk-key-space-bar" aria-hidden="true" />
    </button>
  );
}

function SnippetKey({
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

function LetterRow({
  keys,
  stagger,
  onKey,
  trailingBackspace,
  onBackspace,
  lowercase,
}: {
  keys: string[];
  stagger: 0 | 1 | 2 | 3;
  onKey: (k: string) => void;
  trailingBackspace?: boolean;
  onBackspace?: () => void;
  lowercase?: boolean;
}) {
  return (
    <div
      className={cn(
        "kiosk-key-row kiosk-key-row--letters",
        stagger > 0 && `kiosk-key-row--stagger-${stagger}`,
      )}
    >
      {keys.map((key) => (
        <CharKey
          key={key}
          label={lowercase ? key : key}
          onPress={() => onKey(key)}
        />
      ))}
      {trailingBackspace && onBackspace ? (
        <BackspaceKey onPress={onBackspace} />
      ) : null}
    </div>
  );
}

function NumberRow({ onKey }: { onKey: (k: string) => void }) {
  return (
    <div className="kiosk-key-row kiosk-key-row--letters">
      {ROWS_NUMBERS.map((d) => (
        <CharKey key={d} label={d} onPress={() => onKey(d)} />
      ))}
    </div>
  );
}

function BottomRow({
  onKey,
  onSubmit,
  submitLabel,
  extraKeys = [],
}: {
  onKey: (k: string) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  extraKeys?: string[];
}) {
  const hasSubmit = Boolean(onSubmit && submitLabel);

  return (
    <div
      className={cn(
        "kiosk-key-row",
        hasSubmit ? "kiosk-key-row--bottom" : "kiosk-key-row--bottom-alt",
      )}
    >
      <SpaceKey onPress={() => onKey(" ")} />
      {extraKeys.map((sym) => (
        <CharKey key={sym} label={sym} onPress={() => onKey(sym)} />
      ))}
      {hasSubmit ? (
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onPointerUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSubmit!();
          }}
          className="kiosk-key kiosk-key--submit kiosk-btn-primary flex items-center justify-center gap-2 font-extrabold"
        >
          <SearchIcon />
          <span>{submitLabel}</span>
        </button>
      ) : null}
    </div>
  );
}

function QwertyBlock({
  variant,
  onKey,
  onBackspace,
  onSubmit,
  submitLabel,
}: {
  variant: "location" | "name" | "email";
  onKey: (k: string) => void;
  onBackspace: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
}) {
  const isLocation = variant === "location";
  const qRow = isLocation ? ROWS_Q : ROWS_NAME_Q;
  const aRow = isLocation ? ROWS_A : ROWS_NAME_A;
  const zRow = isLocation ? ROWS_Z : ROWS_NAME_Z;
  const lower = !isLocation;

  const emit = (k: string) => {
    if (isLocation) onKey(k === " " ? " " : k);
    else onKey(k);
  };

  return (
    <>
      {variant === "email" && (
        <div className="kiosk-key-snippets">
          {EMAIL_SNIPPETS.map((snippet) => (
            <SnippetKey
              key={snippet}
              label={snippet}
              onPress={() => onKey(snippet)}
            />
          ))}
        </div>
      )}
      <NumberRow onKey={emit} />
      <LetterRow keys={qRow} stagger={0} onKey={emit} lowercase={lower} />
      <LetterRow keys={aRow} stagger={1} onKey={emit} lowercase={lower} />
      <LetterRow
        keys={zRow}
        stagger={2}
        onKey={emit}
        trailingBackspace
        onBackspace={onBackspace}
        lowercase={lower}
      />
      {variant === "email" && (
        <div className="kiosk-key-row kiosk-key-row--symbols">
          {ROWS_EMAIL_SYMBOLS.map((sym) => (
            <CharKey key={sym} label={sym} onPress={() => onKey(sym)} />
          ))}
        </div>
      )}
      <BottomRow
        onKey={emit}
        onSubmit={variant === "location" ? onSubmit : undefined}
        submitLabel={variant === "location" ? submitLabel : undefined}
        extraKeys={
          variant === "email" ? ["@", "."] : variant === "name" ? ["-", "'"] : ["-"]
        }
      />
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
  return (
    <div className={cn("kiosk-keyboard", className)}>
      {mode === "pin" && (
        <>
          {ROWS_PIN.map((row, i) => (
            <div key={i} className="kiosk-key-row kiosk-key-row--pin">
              {row.map((key) =>
                key ? (
                  <CharKey key={key} label={key} onPress={() => onKey(key)} />
                ) : (
                  <div key={`sp-${i}`} className="kiosk-key-spacer" aria-hidden />
                ),
              )}
            </div>
          ))}
          <div className="kiosk-key-row kiosk-key-row--pin-actions">
            <BackspaceKey onPress={onBackspace} />
            {onSubmit && submitLabel ? (
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onPointerUp={(e) => {
                  e.preventDefault();
                  onSubmit();
                }}
                className="kiosk-key kiosk-key--submit kiosk-btn-primary font-extrabold"
              >
                {submitLabel}
              </button>
            ) : null}
          </div>
        </>
      )}

      {(mode === "location" || mode === "name" || mode === "email") && (
        <QwertyBlock
          variant={mode}
          onKey={onKey}
          onBackspace={onBackspace}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
        />
      )}
    </div>
  );
}

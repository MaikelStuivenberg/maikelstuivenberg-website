import { useState } from "react";
import { cn } from "@/lib/utils";

export type KeyboardMode = "location" | "email" | "name" | "pin";

type Props = {
  mode: KeyboardMode;
  onKey: (key: string) => void;
  onBackspace: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitPending?: boolean;
  submitPendingLabel?: string;
  submitVariant?: "search" | "send";
  spaceLabel?: string;
  /** Hides number row and email snippets for tighter signup layouts. */
  compact?: boolean;
  className?: string;
};

function KioskSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("kiosk-inline-spinner", className)}
      aria-hidden="true"
    />
  );
}

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

function SpaceKey({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => e.preventDefault()}
      onPointerUp={(e) => {
        e.preventDefault();
        onPress();
      }}
      className="kiosk-key kiosk-key--space"
    >
      <span className="kiosk-key-space-bar" aria-hidden="true" />
      <span>{label}</span>
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

function SubmitKey({
  onSubmit,
  submitLabel,
  submitPending,
  submitPendingLabel,
  variant = "search",
}: {
  onSubmit: () => void;
  submitLabel: string;
  submitPending?: boolean;
  submitPendingLabel?: string;
  variant?: "search" | "send";
}) {
  const pending = Boolean(submitPending);
  const label = pending && submitPendingLabel ? submitPendingLabel : submitLabel;

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onPointerDown={(e) => e.preventDefault()}
      onPointerUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!pending) onSubmit();
      }}
      className="kiosk-key kiosk-key--submit flex items-center justify-center gap-2 font-extrabold"
    >
      {pending ? (
        <>
          <KioskSpinner />
          <span>{label}</span>
        </>
      ) : (
        <>
          {variant === "search" ? <SearchIcon /> : null}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

function ShiftKey({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Hoofdletter"
      aria-pressed={active}
      onPointerDown={(e) => e.preventDefault()}
      onPointerUp={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={cn(
        "kiosk-key kiosk-key--shift font-bold text-[var(--kiosk-navy)]",
        active && "kiosk-key--shift-on",
      )}
    >
      ⇧
    </button>
  );
}

function BottomRow({
  onKey,
  onSubmit,
  submitLabel,
  submitPending,
  submitPendingLabel,
  submitVariant,
  spaceLabel,
  extraKeys = [],
}: {
  onKey: (k: string) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitPending?: boolean;
  submitPendingLabel?: string;
  submitVariant?: "search" | "send";
  spaceLabel: string;
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
      <SpaceKey label={spaceLabel} onPress={() => onKey(" ")} />
      {extraKeys.map((sym) => (
        <CharKey key={sym} label={sym} onPress={() => onKey(sym)} />
      ))}
      {hasSubmit ? (
        <SubmitKey
          onSubmit={onSubmit!}
          submitLabel={submitLabel!}
          submitPending={submitPending}
          submitPendingLabel={submitPendingLabel}
          variant={submitVariant}
        />
      ) : null}
    </div>
  );
}

function NameBottomRow({
  onKey,
  onSubmit,
  submitLabel,
  submitPending,
  submitPendingLabel,
  submitVariant,
  spaceLabel,
  shiftOn,
  onShift,
}: {
  onKey: (k: string) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitPending?: boolean;
  submitPendingLabel?: string;
  submitVariant?: "search" | "send";
  spaceLabel: string;
  shiftOn: boolean;
  onShift: () => void;
}) {
  const hasSubmit = Boolean(onSubmit && submitLabel);

  return (
    <div
      className={cn(
        "kiosk-key-row",
        hasSubmit ? "kiosk-key-row--bottom-name" : "kiosk-key-row--bottom-name-alt",
      )}
    >
      <ShiftKey active={shiftOn} onPress={onShift} />
      <SpaceKey label={spaceLabel} onPress={() => onKey(" ")} />
      <CharKey label="'" onPress={() => onKey("'")} />
      <CharKey label="-" onPress={() => onKey("-")} />
      {hasSubmit ? (
        <SubmitKey
          onSubmit={onSubmit!}
          submitLabel={submitLabel!}
          submitPending={submitPending}
          submitPendingLabel={submitPendingLabel}
          variant={submitVariant}
        />
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
  submitPending,
  submitPendingLabel,
  submitVariant,
  spaceLabel,
  compact,
}: {
  variant: "location" | "name" | "email";
  onKey: (k: string) => void;
  onBackspace: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitPending?: boolean;
  submitPendingLabel?: string;
  submitVariant?: "search" | "send";
  spaceLabel: string;
  compact?: boolean;
}) {
  const [shiftOn, setShiftOn] = useState(false);
  const isLocation = variant === "location";
  const isName = variant === "name";
  const qRow = isLocation ? ROWS_Q : ROWS_NAME_Q;
  const aRow = isLocation ? ROWS_A : ROWS_NAME_A;
  const zRow = isLocation ? ROWS_Z : ROWS_NAME_Z;
  const lower = !isLocation;

  const labelFor = (k: string) => {
    if (isLocation) return k;
    return shiftOn ? k.toUpperCase() : k;
  };

  const emit = (k: string) => {
    if (isLocation) {
      onKey(k === " " ? " " : k);
      return;
    }
    if (isName && k.length === 1 && /[a-z]/.test(k)) {
      const out = shiftOn ? k.toUpperCase() : k;
      onKey(out);
      if (shiftOn) setShiftOn(false);
      return;
    }
    onKey(k);
  };

  const showSubmit = Boolean(onSubmit && submitLabel);
  const useNameBottom = isName;

  return (
    <>
      {variant === "email" && !compact && (
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
      {!compact && <NumberRow onKey={emit} />}
      <LetterRow
        keys={qRow.map(labelFor)}
        stagger={0}
        onKey={(label) => emit(isLocation ? label : label.toLowerCase())}
        lowercase={lower}
      />
      <LetterRow
        keys={aRow.map(labelFor)}
        stagger={1}
        onKey={(label) => emit(isLocation ? label : label.toLowerCase())}
        lowercase={lower}
      />
      <LetterRow
        keys={zRow.map(labelFor)}
        stagger={2}
        onKey={(label) => emit(isLocation ? label : label.toLowerCase())}
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
      {useNameBottom ? (
        <NameBottomRow
          onKey={emit}
          onSubmit={showSubmit ? onSubmit : undefined}
          submitLabel={showSubmit ? submitLabel : undefined}
          submitPending={submitPending}
          submitPendingLabel={submitPendingLabel}
          submitVariant={submitVariant}
          spaceLabel={spaceLabel}
          shiftOn={shiftOn}
          onShift={() => setShiftOn((s) => !s)}
        />
      ) : (
        <BottomRow
          onKey={emit}
          onSubmit={showSubmit ? onSubmit : undefined}
          submitLabel={showSubmit ? submitLabel : undefined}
          submitPending={submitPending}
          submitPendingLabel={submitPendingLabel}
          submitVariant={submitVariant}
          spaceLabel={spaceLabel}
          extraKeys={variant === "email" ? ["@", "."] : ["-"]}
        />
      )}
    </>
  );
}

export function OnScreenKeyboard({
  mode,
  onKey,
  onBackspace,
  onSubmit,
  submitLabel,
  submitPending,
  submitPendingLabel,
  submitVariant = "search",
  spaceLabel = "space",
  compact,
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
                className="kiosk-key kiosk-key--submit font-extrabold"
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
          submitPending={submitPending}
          submitPendingLabel={submitPendingLabel}
          submitVariant={submitVariant}
          spaceLabel={spaceLabel}
          compact={compact}
        />
      )}
    </div>
  );
}

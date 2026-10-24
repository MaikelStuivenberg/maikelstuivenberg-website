type Props = {
  /** Screen reader label, e.g. “Naar start” / “Home”. */
  label: string;
  onClick: () => void;
};

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Header home control — reset kiosk to attract (reused by nav PR). */
export function KioskHomeButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      className="kiosk-home-btn"
      aria-label={label}
      onPointerDown={(e) => e.preventDefault()}
      onPointerUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      <HomeIcon className="kiosk-home-btn-icon" />
      <span className="kiosk-home-btn-label">{label}</span>
    </button>
  );
}

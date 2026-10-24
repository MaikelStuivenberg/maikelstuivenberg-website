type Props = {
  homeLabel: string;
  backLabel: string;
  onHome: () => void;
  onBack?: () => void;
  showBack?: boolean;
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

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 6 8 12l6 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 12h10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function KioskHeaderNav({
  homeLabel,
  backLabel,
  onHome,
  onBack,
  showBack = true,
}: Props) {
  const canBack = showBack && Boolean(onBack);

  return (
    <nav
      className="kiosk-header-nav flex shrink-0 items-stretch gap-1.5 sm:gap-2"
      aria-label="Kiosk navigation"
    >
      {canBack ? (
        <button
          type="button"
          className="kiosk-header-nav-btn kiosk-btn-ghost"
          onClick={onBack}
          aria-label={backLabel}
        >
          <BackIcon className="kiosk-header-nav-icon" />
          <span className="kiosk-header-nav-label">{backLabel}</span>
        </button>
      ) : null}
      <button
        type="button"
        className="kiosk-header-nav-btn kiosk-btn-ghost"
        onClick={onHome}
        aria-label={homeLabel}
      >
        <HomeIcon className="kiosk-header-nav-icon" />
        <span className="kiosk-header-nav-label">{homeLabel}</span>
      </button>
    </nav>
  );
}

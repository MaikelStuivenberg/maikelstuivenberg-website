import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PageMeta } from "@/components/PageMeta";
import { cn } from "@/lib/utils";
import { KioskMap } from "./KioskMap";
import { OnScreenKeyboard } from "./OnScreenKeyboard";
import { geocodeDutch, nearestLocations } from "./geo";
import { t, type Locale } from "./i18n";
import {
  clearLegacyEntryStore,
  downloadOutboxCsv,
  KIOSK_ADMIN_PIN,
  loadOutbox,
} from "./kiosk-storage";
import { flushSignupOutbox, submitSignupOptimistic } from "./signup-sync";
import type {
  GeoPoint,
  KioskLocation,
  LocationsBundle,
  MapMode,
  Screen,
} from "./types";
import { AttractScreen } from "./AttractScreen";
import { LocationNameWithBadge } from "./LocationNameWithBadge";
import { LDH_LOGO_PATH } from "./brand";
import { KioskHeaderNav } from "./KioskHeaderNav";
import { LocationMapSheet } from "./LocationMapSheet";
import { appendNameKey } from "./name-input";
import { useKioskAutoFullscreen } from "./useKioskAutoFullscreen";
import { KioskRotateRoot, useKioskRotation } from "./KioskRotateRoot";
import {
  persistAutoFullscreen,
  readAutoFullscreenEnabled,
} from "./kiosk-fullscreen";
import type { KioskRotation } from "./kiosk-rotation";
import "./buurt-kiosk.css";
import "./buurt-kiosk-legacy-compat.css";
import { useKioskLockdown } from "./useKioskLockdown";

const IDLE_MS = 75_000;
const NL_CENTER: [number, number] = [52.15, 5.35];

function kindLabel(kind: string, locale: Locale): string {
  const m = t(locale);
  const map: Record<string, string> = {
    korps: m.kindKorps,
    buurt: m.kindBuurt,
    scouting: m.kindScouting,
    jeugd: m.kindJeugd,
    gidb: m.kindGidb,
  };
  return map[kind] ?? m.kindGidb;
}

function LanguageToggle({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (l: Locale) => void;
}) {
  return (
    <div
      className="kiosk-lang-group flex shrink-0 gap-1 rounded-full bg-white/90 shadow-md ring-1 ring-[var(--kiosk-navy)]/10 sm:gap-2"
      role="group"
      aria-label="Language"
    >
      {(["nl", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={cn(
            "kiosk-lang-btn rounded-full font-bold uppercase tracking-wide transition-colors",
            locale === code
              ? "bg-[var(--kiosk-red)] text-white"
              : "text-[var(--kiosk-navy)]",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

function SignupFieldValue({
  value,
  focused,
}: {
  value: string;
  focused: boolean;
}) {
  return (
    <span className="kiosk-field-value text-xl">
      {value || (!focused ? "…" : null)}
      {focused ? <span className="kiosk-field-caret" aria-hidden="true" /> : null}
    </span>
  );
}

function ThanksCheckmark() {
  return (
    <div className="kiosk-thanks-check" aria-hidden="true">
      <svg viewBox="0 0 64 64" className="kiosk-thanks-check-svg">
        <circle className="kiosk-thanks-check-ring" cx="32" cy="32" r="28" />
        <path
          className="kiosk-thanks-check-mark"
          d="M20 33l8 8 16-18"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function KioskShell({
  locale,
  onLocaleChange,
  onActivity,
  nav,
  children,
}: {
  locale: Locale;
  onLocaleChange: (l: Locale) => void;
  onActivity: () => void;
  nav?: {
    homeLabel: string;
    backLabel: string;
    onHome: () => void;
    onBack?: () => void;
    showBack: boolean;
  };
  children: ReactNode;
}) {
  const m = t(locale);
  return (
    <div
      className="buurt-kiosk flex flex-col"
      onPointerDown={onActivity}
      onTouchStart={onActivity}
    >
      <header className="kiosk-shell-header flex justify-between">
        <div className="kiosk-header-brand flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
          <img
            src={LDH_LOGO_PATH}
            alt="Leger des Heils"
            className="kiosk-header-logo shrink-0"
            width={120}
            height={128}
          />
          <div className="kiosk-header-brand-text min-w-0 leading-tight">
            <p className="kiosk-header-title font-bold text-[var(--kiosk-red)]">
              {m.programme}
            </p>
            <p className="kiosk-header-sub text-[var(--kiosk-teal)]">
              {m.programmeSub}
            </p>
          </div>
        </div>
        <div className="kiosk-header-tools flex shrink-0 items-stretch gap-1.5 sm:gap-2">
          {nav ? (
            <KioskHeaderNav
              homeLabel={nav.homeLabel}
              backLabel={nav.backLabel}
              onHome={nav.onHome}
              onBack={nav.onBack}
              showBack={nav.showBack}
            />
          ) : null}
          <LanguageToggle locale={locale} onChange={onLocaleChange} />
        </div>
      </header>
      <main className="kiosk-main">
        {children}
      </main>
    </div>
  );
}

export function BuurtKioskPage() {
  return (
    <KioskRotateRoot>
      <BuurtKioskApp />
    </KioskRotateRoot>
  );
}

function BuurtKioskApp() {
  useKioskLockdown();
  const { rotation, setRotation, isRotated } = useKioskRotation();
  const [autoFullscreen, setAutoFullscreen] = useState(readAutoFullscreenEnabled);
  useKioskAutoFullscreen(autoFullscreen);
  const [locale, setLocale] = useState<Locale>("nl");
  const [screen, setScreen] = useState<Screen>("attract");
  const [mapMode, setMapMode] = useState<MapMode>("all");
  const [locations, setLocations] = useState<KioskLocation[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<"empty" | "notfound" | null>(
    null,
  );
  const [searchPending, setSearchPending] = useState(false);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [selected, setSelected] = useState<KioskLocation | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [signupError, setSignupError] = useState<
    { field: "name" | "email" | "consent"; message: string } | null
  >(null);
  const [signupField, setSignupField] = useState<"name" | "email">("name");
  const [adminPin, setAdminPin] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminHold, setAdminHold] = useState(0);
  const [outboxCount, setOutboxCount] = useState(0);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const m = t(locale);

  const resetKiosk = useCallback(() => {
    setLocale("nl");
    setScreen("attract");
    setMapMode("all");
    setSearchQuery("");
    setSearchError(null);
    setSearchPending(false);
    setSignupSubmitting(false);
    setOrigin(null);
    setSelected(null);
    setName("");
    setEmail("");
    setConsent(false);
    setSignupError(null);
    setSignupField("name");
    setAdminPin("");
    setAdminUnlocked(false);
    setQuestionIndex(0);
  }, []);

  const bumpIdle = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(resetKiosk, IDLE_MS);
  }, [resetKiosk]);

  useEffect(() => {
    bumpIdle();
    return () => {
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  }, [bumpIdle]);

  const refreshOutboxCount = useCallback(() => {
    setOutboxCount(loadOutbox().length);
  }, []);

  useEffect(() => {
    fetch("/data/gidb-locations.json")
      .then((r) => r.json())
      .then((data: LocationsBundle) => setLocations(data.locations))
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    clearLegacyEntryStore();
    refreshOutboxCount();
    const sync = () => {
      void flushSignupOutbox().then(() => refreshOutboxCount());
    };
    sync();
    const intervalId = window.setInterval(sync, 60_000);
    window.addEventListener("online", sync);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("online", sync);
    };
  }, [refreshOutboxCount]);

  useEffect(() => {
    if (screen !== "attract") return;
    const id = setInterval(() => {
      setQuestionIndex((i) => (i + 1) % m.attractQuestions.length);
    }, 4500);
    return () => clearInterval(id);
  }, [screen, m.attractQuestions.length]);

  const nearbyList = useMemo(() => {
    if (!origin) return [];
    return nearestLocations(origin, locations, 6);
  }, [origin, locations]);

  const mapLocations = useMemo(() => {
    if (mapMode === "nearby" && origin) {
      return nearbyList;
    }
    return locations;
  }, [mapMode, origin, nearbyList, locations]);

  const mapCenter = useMemo((): [number, number] => {
    if (mapMode === "nearby" && origin) return [origin.lat, origin.lon];
    if (selected) return [selected.lat, selected.lon];
    return NL_CENTER;
  }, [mapMode, origin, selected]);

  const go = (next: Screen) => {
    bumpIdle();
    setScreen(next);
  };

  const goHome = () => {
    bumpIdle();
    resetKiosk();
  };

  const goBack = () => {
    bumpIdle();
    if (screen === "search" || screen === "map") {
      go("choose");
      return;
    }
    if (screen === "signup") {
      go("map");
      return;
    }
    if (screen === "thanks") {
      resetKiosk();
      return;
    }
    if (screen === "admin") {
      setAdminUnlocked(false);
      setAdminPin("");
      resetKiosk();
    }
  };

  const headerNav =
    screen === "attract"
      ? undefined
      : {
          homeLabel: m.navHome,
          backLabel: m.navBack,
          onHome: goHome,
          onBack: goBack,
          showBack: screen !== "choose",
        };

  const handleSearch = async () => {
    if (searchPending) return;
    bumpIdle();
    setSearchError(null);
    const query = searchQuery.trim();
    if (!query) {
      setSearchError("empty");
      return;
    }
    setSearchPending(true);
    try {
      const point = await geocodeDutch(query);
      if (!point) {
        setSearchError("notfound");
        return;
      }
      setOrigin(point);
      setMapMode("nearby");
      setSelected(null);
      go("map");
    } finally {
      setSearchPending(false);
    }
  };

  const submitSignup = async () => {
    if (signupSubmitting) return;
    bumpIdle();
    if (!name.trim()) {
      setSignupField("name");
      setSignupError({ field: "name", message: m.signupNeedName });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSignupField("email");
      setSignupError({ field: "email", message: m.signupNeedEmail });
      return;
    }
    if (!consent) {
      setSignupError({ field: "consent", message: m.signupNeedConsent });
      return;
    }
    setSignupError(null);
    setSignupSubmitting(true);
    const postcode = searchQuery.trim().slice(0, 40) || null;
    try {
      await submitSignupOptimistic({
        name: name.trim(),
        email: email.trim(),
        consent: true,
        language: locale,
        postcode,
        source: "kiosk",
      });
      refreshOutboxCount();
      go("thanks");
    } finally {
      setSignupSubmitting(false);
    }
  };

  const startAdminHold = () => {
    if (holdRef.current) clearInterval(holdRef.current);
    setAdminHold(0);
    holdRef.current = setInterval(() => {
      setAdminHold((h) => {
        if (h >= 100) {
          if (holdRef.current) clearInterval(holdRef.current);
          go("admin");
          return 100;
        }
        return h + 4;
      });
    }, 80);
  };

  const endAdminHold = () => {
    if (holdRef.current) clearInterval(holdRef.current);
    setAdminHold(0);
  };

  const tryAdminPin = () => {
    if (adminPin === KIOSK_ADMIN_PIN) {
      setAdminUnlocked(true);
      setAdminPin("");
    }
  };

  const outbox = loadOutbox();

  return (
    <>
      <PageMeta
        title={`${m.programme} | Kiosk`}
        description="Geloven in de Buurt event kiosk"
      />
      <KioskShell
        locale={locale}
        onLocaleChange={(l) => {
          bumpIdle();
          setLocale(l);
        }}
        onActivity={bumpIdle}
        nav={headerNav}
      >
        {screen === "attract" && (
          <AttractScreen
            questions={[...m.attractQuestions]}
            questionIndex={questionIndex}
            tagline={m.campaignTagline}
            cta={m.attractCta}
            lunchTapeLabel={m.attractLunchTape}
            lunchHeadline1={m.attractLunchHeadline1}
            lunchHeadline2Prefix={m.attractLunchHeadline2Prefix}
            soulStationName={m.soulStationName}
            lunchFinePrint={m.attractLunchFinePrint}
            placesCount={locations.length || "…"}
            placesCountTemplate={m.attractPlacesCount}
            locations={locations}
            onStart={() => go("choose")}
            onLunchPromo={() => {
              setMapMode("all");
              setSelected(null);
              setSearchQuery("");
              setSearchError(null);
              go("signup");
            }}
          />
        )}

        {screen === "choose" && (
          <div className="kiosk-screen kiosk-screen--center">
            <h1 className="kiosk-screen-title text-center text-[var(--kiosk-navy)]">
              {m.chooseTitle}
            </h1>
            <button
              type="button"
              className="kiosk-choice-btn kiosk-btn-primary text-left"
              onClick={() => {
                setMapMode("all");
                setSelected(null);
                go("map");
              }}
            >
              <span className="kiosk-choice-title block">{m.chooseAll}</span>
              <span className="kiosk-choice-hint mt-2 block opacity-90">
                {m.chooseAllHint}
              </span>
            </button>
            <button
              type="button"
              className="kiosk-choice-btn kiosk-card kiosk-card--outline text-left"
              onClick={() => go("search")}
            >
              <span className="kiosk-choice-title block text-[var(--kiosk-navy)]">
                {m.chooseNear}
              </span>
              <span className="kiosk-choice-hint mt-2 block text-[var(--kiosk-teal)]">
                {m.chooseNearHint}
              </span>
            </button>
            {loadError && (
              <p className="text-center text-sm text-[var(--kiosk-red-dark)]">
                {m.loadError}
              </p>
            )}
          </div>
        )}

        {screen === "search" && (
          <div className="kiosk-screen kiosk-screen--search">
            <div className="kiosk-search-hero">
              <h1 className="kiosk-screen-title text-center">{m.searchTitle}</h1>
              <div
                className="kiosk-input-display kiosk-card w-full px-4 py-3"
                role="textbox"
                aria-label={m.searchPlaceholder}
              >
                {searchQuery || (
                  <span className="text-[var(--kiosk-teal)] opacity-60">
                    {m.searchPlaceholder}
                  </span>
                )}
              </div>
              {searchError === "empty" && (
                <p className="kiosk-screen-body text-center font-semibold text-[var(--kiosk-teal)]">
                  {m.searchEmptyHint}
                </p>
              )}
              {searchError === "notfound" && (
                <p className="kiosk-screen-body text-center font-semibold text-[var(--kiosk-red)]">
                  {m.searchError}
                </p>
              )}
            </div>
            <div className="kiosk-keyboard-dock">
              <OnScreenKeyboard
                mode="location"
                onKey={(k) => {
                  setSearchError(null);
                  setSearchQuery((q) => (q + k).slice(0, 40));
                }}
                onBackspace={() => {
                  setSearchError(null);
                  setSearchQuery((q) => q.slice(0, -1));
                }}
                onSubmit={() => void handleSearch()}
                submitLabel={m.searchGo}
                submitPending={searchPending}
                submitPendingLabel={m.searchSending}
                spaceLabel={m.spaceKeyLabel}
              />
            </div>
          </div>
        )}

        {screen === "map" && (
          <div className="kiosk-map-layout kiosk-screen">
            <h1 className="kiosk-screen-title text-[var(--kiosk-navy)]">
              {mapMode === "all" ? m.mapAllTitle : m.mapNearTitle}
            </h1>
            <div className="kiosk-map-stage">
              <div className="kiosk-map-canvas">
                <KioskMap
                  locations={mapLocations}
                  center={mapCenter}
                  zoom={mapMode === "all" ? 7 : 11}
                  selectedId={selected?.id}
                  onSelect={(loc) => {
                    setSelected(loc);
                    bumpIdle();
                  }}
                  fitBounds={mapMode === "all"}
                  softwareRotated={isRotated}
                />
              </div>
              {selected ? (
                <LocationMapSheet
                  location={selected}
                  newLabel={m.locationNewBadge}
                  placeJoinLabel={m.placeJoinHere}
                  qrHint={m.mapSheetQrHint}
                  closeLabel={m.mapSheetClose}
                  helpCta={m.mapHelp}
                  onClose={() => setSelected(null)}
                  onHelp={() => go("signup")}
                />
              ) : null}
            </div>
            {mapMode === "nearby" && nearbyList.length === 0 && (
              <p className="text-center text-lg">{m.mapNoResults}</p>
            )}
            <div className="kiosk-map-list space-y-2">
              {(mapMode === "nearby" ? nearbyList : []).map(
                (loc) => {
                  const dist =
                    "distanceKm" in loc
                      ? (loc as { distanceKm: number }).distanceKm
                      : null;
                  const active = selected?.id === loc.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setSelected(loc)}
                      className={cn(
                        "kiosk-card kiosk-list-item w-full px-4 py-3 text-left transition-colors",
                        active && "kiosk-card--active",
                      )}
                    >
                      <p className="kiosk-screen-body font-bold leading-snug">
                        <LocationNameWithBadge
                          locationId={loc.id}
                          title={loc.title}
                          newLabel={m.locationNewBadge}
                        />
                      </p>
                      <p className="text-base text-[var(--kiosk-teal)] md:text-lg">
                        {kindLabel(loc.kind, locale)}
                        {dist != null &&
                          ` · ${dist.toFixed(1)} ${m.mapDistance}`}
                      </p>
                    </button>
                  );
                },
              )}
            </div>
            {!selected ? (
              <button
                type="button"
                className="kiosk-touch-btn kiosk-btn-primary shrink-0"
                onClick={() => go("signup")}
              >
                {m.mapHelp}
              </button>
            ) : null}
          </div>
        )}

        {screen === "signup" && (
          <div className="kiosk-screen kiosk-screen--signup">
            <div className="kiosk-signup-form">
              <p className="kiosk-signup-heading font-bold text-[var(--kiosk-navy)]">
                {m.signupTitle}
              </p>
              {selected ? (
                <p className="kiosk-signup-place truncate font-medium text-[var(--kiosk-teal)]">
                  <LocationNameWithBadge
                    locationId={selected.id}
                    title={selected.title}
                    newLabel={m.locationNewBadge}
                  />
                </p>
              ) : null}
              <div className="kiosk-signup-fields">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupField("name");
                      if (signupError?.field === "name") setSignupError(null);
                    }}
                    className={cn(
                      "kiosk-card kiosk-field kiosk-signup-field",
                      signupField === "name" && "kiosk-field--focused",
                      signupError?.field === "name" && "kiosk-field--error",
                    )}
                  >
                    <span className="kiosk-signup-field-label">{m.signupName}</span>
                    <SignupFieldValue value={name} focused={signupField === "name"} />
                  </button>
                  {signupError?.field === "name" && (
                    <p className="kiosk-field-error" role="alert">
                      {signupError.message}
                    </p>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupField("email");
                      if (signupError?.field === "email") setSignupError(null);
                    }}
                    className={cn(
                      "kiosk-card kiosk-field kiosk-signup-field",
                      signupField === "email" && "kiosk-field--focused",
                      signupError?.field === "email" && "kiosk-field--error",
                    )}
                  >
                    <span className="kiosk-signup-field-label">{m.signupEmail}</span>
                    <SignupFieldValue value={email} focused={signupField === "email"} />
                  </button>
                  {signupError?.field === "email" && (
                    <p className="kiosk-field-error" role="alert">
                      {signupError.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="kiosk-card kiosk-signup-lunch">
                <p className="kiosk-signup-lunch-title font-bold text-[var(--kiosk-red)]">
                  {m.signupLunchTitle}
                </p>
                <p className="kiosk-signup-lunch-body">{m.signupLunchBody}</p>
                <label className="kiosk-signup-consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (signupError?.field === "consent") setSignupError(null);
                    }}
                    className="kiosk-signup-consent-check accent-[var(--kiosk-red)]"
                  />
                  <span>{m.signupConsent}</span>
                </label>
                {signupError?.field === "consent" && (
                  <p className="kiosk-field-error mt-1" role="alert">
                    {signupError.message}
                  </p>
                )}
              </div>
            </div>
            <div className="kiosk-keyboard-dock">
              <OnScreenKeyboard
                mode={signupField === "email" ? "email" : "name"}
                compact
                onKey={(k) => {
                  if (signupField === "name") {
                    setName((n) => appendNameKey(n, k));
                    if (signupError?.field === "name") setSignupError(null);
                  } else {
                    setEmail((e) => (e + k).slice(0, 120));
                    if (signupError?.field === "email") setSignupError(null);
                  }
                }}
                onBackspace={() => {
                  if (signupField === "name") {
                    setName((n) => n.slice(0, -1));
                    if (signupError?.field === "name") setSignupError(null);
                  } else {
                    setEmail((e) => e.slice(0, -1));
                    if (signupError?.field === "email") setSignupError(null);
                  }
                }}
                onSubmit={() => void submitSignup()}
                submitLabel={m.signupSubmit}
                submitPending={signupSubmitting}
                submitPendingLabel={m.signupSending}
                submitVariant="send"
                spaceLabel={m.spaceKeyLabel}
              />
            </div>
          </div>
        )}

        {screen === "thanks" && (
          <div className="kiosk-screen kiosk-screen--center items-center gap-6 text-center">
            <ThanksCheckmark />
            <h1 className="kiosk-thanks-title font-extrabold text-[var(--kiosk-red)]">
              {m.thanksTitle}
            </h1>
            <p className="kiosk-thanks-body max-w-md leading-snug text-[var(--kiosk-teal)]">
              {m.thanksBody}
            </p>
            <button
              type="button"
              className="kiosk-touch-btn kiosk-btn-secondary min-w-[12rem] font-bold"
              onClick={resetKiosk}
            >
              {m.thanksDone}
            </button>
          </div>
        )}

        {screen === "admin" && (
          <div className="flex flex-1 flex-col gap-4">
            <h1 className="text-2xl font-bold">{m.adminTitle}</h1>
            <p className="kiosk-admin-ua break-all text-xs leading-snug text-[var(--kiosk-teal)]">
              <span className="font-semibold text-[var(--kiosk-navy)]">
                {m.adminUserAgent}
              </span>{" "}
              {navigator.userAgent}
            </p>
            {!adminUnlocked ? (
              <>
                <p className="text-sm">{m.adminPin}</p>
                <div className="rounded-xl bg-white px-4 py-3 text-2xl tracking-widest">
                  {adminPin.replace(/./g, "•")}
                </div>
                <OnScreenKeyboard
                  mode="pin"
                  onKey={(k) => setAdminPin((p) => (p.length < 8 ? p + k : p))}
                  onBackspace={() => setAdminPin((p) => p.slice(0, -1))}
                  onSubmit={tryAdminPin}
                  submitLabel="OK"
                />
                {adminPin && adminPin !== KIOSK_ADMIN_PIN && (
                  <p className="text-[var(--kiosk-red)]">{m.adminWrongPin}</p>
                )}
              </>
            ) : (
              <>
                <div className="kiosk-card p-4">
                  <p className="font-bold text-[var(--kiosk-navy)]">
                    {m.adminRotationTitle}
                  </p>
                  <p className="mt-1 text-sm text-[var(--kiosk-teal)]">
                    {m.adminRotationHint}
                  </p>
                  <div className="kiosk-admin-rotate mt-3">
                    {([0, 90, 270] as const).map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        className={cn(
                          "kiosk-admin-rotate-btn",
                          rotation === deg && "kiosk-admin-rotate-btn--active",
                        )}
                        onClick={() => setRotation(deg as KioskRotation)}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
                <div className="kiosk-card p-4">
                  <p className="font-bold text-[var(--kiosk-navy)]">
                    {m.adminAutoFullscreenTitle}
                  </p>
                  <p className="mt-1 text-sm text-[var(--kiosk-teal)]">
                    {m.adminAutoFullscreenHint}
                  </p>
                  <label className="mt-3 flex items-center gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={autoFullscreen}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setAutoFullscreen(on);
                        persistAutoFullscreen(on);
                      }}
                      className="h-6 w-6 shrink-0 accent-[var(--kiosk-red)]"
                    />
                    <span>{m.adminAutoFullscreenTitle}</span>
                  </label>
                </div>
                <p className="text-lg font-semibold">
                  {outboxCount} {m.adminOutboxCount}
                </p>
                <p className="text-sm text-[var(--kiosk-teal)]">
                  {m.adminOutboxHint}
                </p>
                {outboxCount === 0 ? (
                  <p>{m.adminOutboxEmpty}</p>
                ) : (
                  <button
                    type="button"
                    className="min-h-14 rounded-xl bg-[var(--kiosk-red)] font-bold text-white"
                    onClick={() => downloadOutboxCsv(outbox)}
                  >
                    {m.adminExport}
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              className="min-h-12 rounded-xl bg-[var(--kiosk-navy)] text-white"
              onClick={() => {
                setAdminUnlocked(false);
                go("attract");
              }}
            >
              {m.adminClose}
            </button>
          </div>
        )}

        <button
          type="button"
          aria-label="Admin"
          className="fixed bottom-2 left-2 h-10 w-10 opacity-[0.07]"
          onPointerDown={startAdminHold}
          onPointerUp={endAdminHold}
          onPointerLeave={endAdminHold}
          style={{ background: adminHold > 0 ? `rgba(231,35,26,${adminHold / 200})` : undefined }}
        />
      </KioskShell>
    </>
  );
}

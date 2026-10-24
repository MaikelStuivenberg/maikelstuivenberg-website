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
import { OnScreenKeyboard, SearchIcon } from "./OnScreenKeyboard";
import { geocodeDutch, nearestLocations } from "./geo";
import { t, type Locale } from "./i18n";
import {
  clearLegacyEntryStore,
  downloadOutboxCsv,
  KIOSK_ADMIN_PIN,
  loadOutbox,
} from "./kiosk-storage";
import { flushSignupOutbox, submitSignupWithSync } from "./signup-sync";
import type {
  GeoPoint,
  KioskLocation,
  LocationsBundle,
  MapMode,
  Screen,
} from "./types";
import { AttractScreen } from "./AttractScreen";
import { LDH_LOGO_PATH } from "./brand";
import "./buurt-kiosk.css";

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
  children,
}: {
  locale: Locale;
  onLocaleChange: (l: Locale) => void;
  onActivity: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="buurt-kiosk flex flex-col"
      onPointerDown={onActivity}
      onTouchStart={onActivity}
    >
      <header className="kiosk-shell-header flex justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-4">
          <img
            src={LDH_LOGO_PATH}
            alt="Leger des Heils"
            className="kiosk-header-logo shrink-0"
            width={120}
            height={128}
          />
          <div className="min-w-0 leading-tight">
            <p className="kiosk-header-title font-bold text-[var(--kiosk-red)]">
              {t(locale).programme}
            </p>
            <p className="kiosk-header-sub text-[var(--kiosk-teal)]">
              {t(locale).programmeSub}
            </p>
          </div>
        </div>
        <LanguageToggle locale={locale} onChange={onLocaleChange} />
      </header>
      <main className="kiosk-main">{children}</main>
    </div>
  );
}

export function BuurtKioskPage() {
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
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [selected, setSelected] = useState<KioskLocation | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
    setOrigin(null);
    setSelected(null);
    setName("");
    setEmail("");
    setConsent(false);
    setFormError(null);
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

  const handleSearch = async () => {
    bumpIdle();
    setSearchError(null);
    const query = searchQuery.trim();
    if (!query) {
      setSearchError("empty");
      return;
    }
    const point = await geocodeDutch(query);
    if (!point) {
      setSearchError("notfound");
      return;
    }
    setOrigin(point);
    setMapMode("nearby");
    setSelected(null);
    go("map");
  };

  const submitSignup = async () => {
    bumpIdle();
    if (!name.trim()) {
      setFormError(m.signupNeedName);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError(m.signupNeedEmail);
      return;
    }
    if (!consent) {
      setFormError(m.signupNeedConsent);
      return;
    }
    setFormError(null);
    const postcode = searchQuery.trim().slice(0, 40) || null;
    await submitSignupWithSync({
      name: name.trim(),
      email: email.trim(),
      consent: true,
      language: locale,
      postcode,
      source: "kiosk",
    });
    refreshOutboxCount();
    go("thanks");
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
      >
        {screen === "attract" && (
          <AttractScreen
            questions={[...m.attractQuestions]}
            questionIndex={questionIndex}
            tagline={m.campaignTagline}
            cta={m.attractCta}
            placesCount={locations.length || "…"}
            placesCountTemplate={m.attractPlacesCount}
            locations={locations}
            onStart={() => go("choose")}
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
          <div className="kiosk-screen">
            <h1 className="kiosk-screen-title">{m.searchTitle}</h1>
            <div className="flex shrink-0 gap-2">
              <div
                className="kiosk-input-display kiosk-card min-w-0 flex-1 px-4 py-3"
                role="textbox"
                aria-label={m.searchPlaceholder}
              >
                {searchQuery || (
                  <span className="text-[var(--kiosk-teal)] opacity-60">
                    {m.searchPlaceholder}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="kiosk-touch-btn kiosk-btn-primary kiosk-search-go-btn flex shrink-0 items-center justify-center gap-2 px-3"
                onPointerDown={(e) => e.preventDefault()}
                onPointerUp={(e) => {
                  e.preventDefault();
                  void handleSearch();
                }}
              >
                <SearchIcon />
                {m.searchGo}
              </button>
            </div>
            {searchError === "empty" && (
              <p className="kiosk-screen-body font-semibold text-[var(--kiosk-teal)]">
                {m.searchEmptyHint}
              </p>
            )}
            {searchError === "notfound" && (
              <p className="kiosk-screen-body font-semibold text-[var(--kiosk-red)]">
                {m.searchError}
              </p>
            )}
            <div className="kiosk-keyboard-panel min-h-0 flex-1">
              <OnScreenKeyboard
                mode="location"
                onKey={(k) => {
                  setSearchError(null);
                  setSearchQuery((q) => q + k);
                }}
                onBackspace={() => {
                  setSearchError(null);
                  setSearchQuery((q) => q.slice(0, -1));
                }}
                onSubmit={() => void handleSearch()}
                submitLabel={m.searchGo}
              />
            </div>
            <button
              type="button"
              className="kiosk-touch-btn kiosk-btn-secondary shrink-0"
              onClick={() => go("choose")}
            >
              {m.searchBack}
            </button>
          </div>
        )}

        {screen === "map" && (
          <div className="kiosk-map-layout kiosk-screen">
            <div className="flex items-center justify-between gap-2">
              <h1 className="kiosk-screen-title text-[var(--kiosk-navy)]">
                {mapMode === "all" ? m.mapAllTitle : m.mapNearTitle}
              </h1>
              <button
                type="button"
                className="kiosk-touch-btn kiosk-btn-secondary shrink-0 px-4"
                onClick={() => go("choose")}
              >
                {m.mapBack}
              </button>
            </div>
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
              />
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
                        {loc.title}
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
            {selected && (
              <div className="kiosk-card shrink-0 p-4">
                <p className="kiosk-campaign-tagline">{m.campaignTagline}</p>
                <p className="mt-2 text-sm font-bold uppercase tracking-wide text-[var(--kiosk-teal)]">
                  {m.placeJoinHere}
                </p>
                <p className="mt-1 text-lg font-bold">{selected.title}</p>
                <p className="mt-1 text-sm">{selected.address}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {selected.url && (
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[var(--kiosk-red)] underline"
                    >
                      {selected.url.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  <a
                    href={m.linksVolunteerVacancies}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[var(--kiosk-red)] underline"
                  >
                    {m.volunteerLink}
                  </a>
                </div>
              </div>
            )}
            <button
              type="button"
              className="kiosk-touch-btn kiosk-btn-primary shrink-0"
              onClick={() => go("signup")}
            >
              {m.mapHelp}
            </button>
          </div>
        )}

        {screen === "signup" && (
          <div className="kiosk-screen kiosk-screen--scroll">
            <h1 className="kiosk-screen-title text-[var(--kiosk-red)]">
              {m.campaignTagline}
            </h1>
            <p className="kiosk-signup-subtitle font-bold text-[var(--kiosk-navy)]">
              {m.signupTitle}
            </p>
            <p className="kiosk-screen-body">{m.signupIntro}</p>
            {selected && (
              <p className="rounded-lg bg-[var(--kiosk-mint)]/40 px-3 py-2 text-sm font-medium">
                {selected.title}
              </p>
            )}
            <button
              type="button"
              onClick={() => setSignupField("name")}
              className={cn(
                "kiosk-card kiosk-field px-4 py-3 text-left text-xl",
                signupField === "name" && "kiosk-card--active",
              )}
            >
              <span className="block text-sm font-semibold">{m.signupName}</span>
              {name || "…"}
            </button>
            <button
              type="button"
              onClick={() => setSignupField("email")}
              className={cn(
                "kiosk-card kiosk-field px-4 py-3 text-left text-xl",
                signupField === "email" && "kiosk-card--active",
              )}
            >
              <span className="block text-sm font-semibold">{m.signupEmail}</span>
              {email || "…"}
            </button>
            <div className="kiosk-card p-4">
              <p className="font-bold text-[var(--kiosk-red)]">{m.signupLunchTitle}</p>
              <p className="mt-1 text-sm">{m.signupLunchBody}</p>
              <label className="mt-3 flex items-start gap-3 text-sm leading-snug">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-6 w-6 shrink-0 accent-[var(--kiosk-red)]"
                />
                <span>{m.signupConsent}</span>
              </label>
            </div>
            {formError && (
              <p className="font-medium text-[var(--kiosk-red)]">{formError}</p>
            )}
            <OnScreenKeyboard
              mode={signupField === "email" ? "email" : "name"}
              onKey={(k) => {
                if (signupField === "name") setName((n) => n + k);
                else setEmail((e) => e + k);
              }}
              onBackspace={() => {
                if (signupField === "name") setName((n) => n.slice(0, -1));
                else setEmail((e) => e.slice(0, -1));
              }}
            />
            <div className="flex flex-col gap-2 text-sm">
              <a
                href={m.linksVolunteerVacancies}
                className="font-semibold text-[var(--kiosk-red)] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {m.volunteerLink}
              </a>
              <a
                href={m.linksBuurtwerk}
                className="font-semibold text-[var(--kiosk-red)] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {m.volunteerBuurtLink}
              </a>
              <a
                href={m.linksVolunteerForm}
                className="font-semibold text-[var(--kiosk-red)] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {m.volunteerGeneralLink}
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-2">
              <button
                type="button"
                className="kiosk-touch-btn kiosk-btn-secondary font-semibold"
                onClick={() => go("map")}
              >
                {m.signupSkip}
              </button>
              <button
                type="button"
                className="kiosk-touch-btn kiosk-btn-primary font-bold"
                onClick={submitSignup}
              >
                {m.signupSubmit}
              </button>
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

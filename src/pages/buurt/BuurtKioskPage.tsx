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
  downloadCsv,
  KIOSK_ADMIN_PIN,
  loadEntries,
  saveEntry,
} from "./kiosk-storage";
import type {
  GeoPoint,
  KioskLocation,
  LocationsBundle,
  MapMode,
  Screen,
} from "./types";
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
      className="flex shrink-0 gap-2 rounded-full bg-white/90 p-1 shadow-md ring-1 ring-[var(--kiosk-navy)]/10"
      role="group"
      aria-label="Language"
    >
      {(["nl", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={cn(
            "min-h-12 min-w-[4.5rem] rounded-full px-4 text-lg font-bold uppercase tracking-wide transition-colors",
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
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={LDH_LOGO_PATH}
            alt="Leger des Heils"
            className="h-14 w-auto shrink-0"
            width={52}
            height={56}
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold text-[var(--kiosk-red)]">
              {t(locale).programme}
            </p>
            <p className="truncate text-xs text-[var(--kiosk-teal)]">
              {t(locale).programmeSub}
            </p>
          </div>
        </div>
        <LanguageToggle locale={locale} onChange={onLocaleChange} />
      </header>
      <main className="flex min-h-0 flex-1 flex-col px-4 pb-4">{children}</main>
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
  const [searchError, setSearchError] = useState(false);
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
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const m = t(locale);

  const resetKiosk = useCallback(() => {
    setLocale("nl");
    setScreen("attract");
    setMapMode("all");
    setSearchQuery("");
    setSearchError(false);
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

  useEffect(() => {
    fetch("/data/gidb-locations.json")
      .then((r) => r.json())
      .then((data: LocationsBundle) => setLocations(data.locations))
      .catch(() => setLoadError(true));
  }, []);

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
    setSearchError(false);
    const point = await geocodeDutch(searchQuery);
    if (!point) {
      setSearchError(true);
      return;
    }
    setOrigin(point);
    setMapMode("nearby");
    setSelected(null);
    go("map");
  };

  const submitSignup = () => {
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
    saveEntry({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: name.trim(),
      email: email.trim(),
      consent: true,
      locale,
      placeId: selected?.id,
      placeTitle: selected?.title,
    });
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

  const entries = loadEntries();

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
          <button
            type="button"
            className="flex flex-1 flex-col items-center justify-center gap-8 rounded-3xl bg-gradient-to-b from-[var(--kiosk-red-light)] to-white px-6 text-center shadow-inner"
            onClick={() => go("choose")}
          >
            <p
              key={questionIndex}
              className="kiosk-attract-text max-w-xl text-4xl font-extrabold leading-tight text-[var(--kiosk-navy)] md:text-5xl"
            >
              {m.attractQuestions[questionIndex]}
            </p>
            <p className="kiosk-tap-hint rounded-2xl bg-[var(--kiosk-red)] px-8 py-5 text-2xl font-bold text-white shadow-lg">
              {m.attractCta}
            </p>
          </button>
        )}

        {screen === "choose" && (
          <div className="flex flex-1 flex-col justify-center gap-6">
            <h1 className="text-center text-3xl font-extrabold text-[var(--kiosk-navy)]">
              {m.chooseTitle}
            </h1>
            <button
              type="button"
              className="rounded-2xl bg-[var(--kiosk-red)] px-6 py-8 text-left text-white shadow-lg active:scale-[0.98]"
              onClick={() => {
                setMapMode("all");
                setSelected(null);
                go("map");
              }}
            >
              <span className="block text-2xl font-bold">{m.chooseAll}</span>
              <span className="mt-2 block text-lg opacity-90">{m.chooseAllHint}</span>
            </button>
            <button
              type="button"
              className="rounded-2xl border-2 border-[var(--kiosk-teal)] bg-white px-6 py-8 text-left shadow-lg active:scale-[0.98]"
              onClick={() => go("search")}
            >
              <span className="block text-2xl font-bold text-[var(--kiosk-navy)]">
                {m.chooseNear}
              </span>
              <span className="mt-2 block text-lg text-[var(--kiosk-teal)]">
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
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <h1 className="text-2xl font-bold">{m.searchTitle}</h1>
            <div
              className="rounded-xl border-2 border-[var(--kiosk-mint)] bg-white px-4 py-4 text-2xl font-semibold"
              role="textbox"
              aria-label={m.searchPlaceholder}
            >
              {searchQuery || (
                <span className="text-[var(--kiosk-teal)] opacity-60">
                  {m.searchPlaceholder}
                </span>
              )}
            </div>
            {searchError && (
              <p className="text-lg font-medium text-[var(--kiosk-red)]">
                {m.searchError}
              </p>
            )}
            <OnScreenKeyboard
              mode="location"
              onKey={(k) => setSearchQuery((q) => q + k)}
              onBackspace={() => setSearchQuery((q) => q.slice(0, -1))}
              onEnter={handleSearch}
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="min-h-14 rounded-xl bg-[var(--kiosk-navy)] text-lg font-semibold text-white"
                onClick={() => go("choose")}
              >
                {m.searchBack}
              </button>
              <button
                type="button"
                className="min-h-14 rounded-xl bg-[var(--kiosk-red)] text-lg font-bold text-white"
                onClick={handleSearch}
              >
                {m.searchGo}
              </button>
            </div>
          </div>
        )}

        {screen === "map" && (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-bold">
                {mapMode === "all" ? m.mapAllTitle : m.mapNearTitle}
              </h1>
              <button
                type="button"
                className="shrink-0 rounded-lg bg-[var(--kiosk-navy)] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => go("choose")}
              >
                {m.mapBack}
              </button>
            </div>
            <div className="min-h-[32vh] flex-1">
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
            <div className="max-h-[38vh] space-y-2 overflow-y-auto">
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
                        "w-full rounded-xl border-2 px-4 py-3 text-left transition-colors",
                        active
                          ? "border-[var(--kiosk-red)] bg-[var(--kiosk-red-light)]"
                          : "border-transparent bg-white",
                      )}
                    >
                      <p className="font-bold leading-snug">{loc.title}</p>
                      <p className="text-sm text-[var(--kiosk-teal)]">
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
              <div className="rounded-2xl bg-white p-4 shadow-md">
                <p className="text-lg font-bold">{selected.title}</p>
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
              className="min-h-16 rounded-2xl bg-[var(--kiosk-red)] text-xl font-bold text-white shadow-lg"
              onClick={() => go("signup")}
            >
              {m.mapHelp}
            </button>
          </div>
        )}

        {screen === "signup" && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            <h1 className="text-2xl font-bold">{m.signupTitle}</h1>
            <p className="text-base leading-snug">{m.signupIntro}</p>
            {selected && (
              <p className="rounded-lg bg-[var(--kiosk-mint)]/40 px-3 py-2 text-sm font-medium">
                {selected.title}
              </p>
            )}
            <button
              type="button"
              onClick={() => setSignupField("name")}
              className={cn(
                "rounded-xl border-2 px-4 py-3 text-left text-xl",
                signupField === "name"
                  ? "border-[var(--kiosk-red)] bg-[var(--kiosk-red-light)]"
                  : "border-[var(--kiosk-mint)] bg-white",
              )}
            >
              <span className="block text-sm font-semibold">{m.signupName}</span>
              {name || "…"}
            </button>
            <button
              type="button"
              onClick={() => setSignupField("email")}
              className={cn(
                "rounded-xl border-2 px-4 py-3 text-left text-xl",
                signupField === "email"
                  ? "border-[var(--kiosk-red)] bg-[var(--kiosk-red-light)]"
                  : "border-[var(--kiosk-mint)] bg-white",
              )}
            >
              <span className="block text-sm font-semibold">{m.signupEmail}</span>
              {email || "…"}
            </button>
            <div className="rounded-xl bg-white p-4">
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
              mode={signupField === "email" ? "email" : "text"}
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
                className="min-h-14 rounded-xl border-2 border-[var(--kiosk-teal)] font-semibold"
                onClick={() => go("map")}
              >
                {m.signupSkip}
              </button>
              <button
                type="button"
                className="min-h-14 rounded-xl bg-[var(--kiosk-red)] font-bold text-white"
                onClick={submitSignup}
              >
                {m.signupSubmit}
              </button>
            </div>
          </div>
        )}

        {screen === "thanks" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <h1 className="text-4xl font-extrabold text-[var(--kiosk-red)]">
              {m.thanksTitle}
            </h1>
            <p className="max-w-md text-xl leading-snug">{m.thanksBody}</p>
            <button
              type="button"
              className="min-h-16 min-w-[12rem] rounded-2xl bg-[var(--kiosk-navy)] text-xl font-bold text-white"
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
                  onEnter={tryAdminPin}
                />
                {adminPin && adminPin !== KIOSK_ADMIN_PIN && (
                  <p className="text-[var(--kiosk-red)]">{m.adminWrongPin}</p>
                )}
              </>
            ) : (
              <>
                <p>
                  {entries.length} {m.adminCount}
                </p>
                {entries.length === 0 ? (
                  <p>{m.adminEmpty}</p>
                ) : (
                  <button
                    type="button"
                    className="min-h-14 rounded-xl bg-[var(--kiosk-red)] font-bold text-white"
                    onClick={() => downloadCsv(entries)}
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

import type { Locale } from "./i18n";
import {
  loadOutbox,
  saveOutbox,
  type SignupOutboxEntry,
} from "./kiosk-storage";
import { SUPABASE_ANON_KEY, SUPABASE_SIGNUPS_URL } from "./supabase-config";

export type SignupPayload = {
  name: string;
  email: string;
  consent: boolean;
  language: Locale;
  postcode: string | null;
  source: string;
};

function supabaseHeaders(): HeadersInit {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
}

export async function postSignupToSupabase(
  payload: SignupPayload,
): Promise<boolean> {
  try {
    const res = await fetch(SUPABASE_SIGNUPS_URL, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        consent: payload.consent,
        language: payload.language,
        postcode: payload.postcode,
        source: payload.source,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function flushSignupOutbox(): Promise<number> {
  const outbox = loadOutbox();
  if (outbox.length === 0) return 0;

  const remaining: SignupOutboxEntry[] = [];
  for (const entry of outbox) {
    const ok = await postSignupToSupabase({
      name: entry.name,
      email: entry.email,
      consent: entry.consent,
      language: entry.language,
      postcode: entry.postcode,
      source: entry.source,
    });
    if (!ok) remaining.push(entry);
  }

  saveOutbox(remaining);
  return remaining.length;
}

export function enqueueSignupOutbox(
  payload: SignupPayload,
): SignupOutboxEntry {
  const entry: SignupOutboxEntry = {
    localId: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
    ...payload,
  };
  const outbox = loadOutbox();
  outbox.push(entry);
  saveOutbox(outbox);
  return entry;
}

export async function submitSignupWithSync(
  payload: SignupPayload,
): Promise<void> {
  const sent = await postSignupToSupabase(payload);
  if (!sent) enqueueSignupOutbox(payload);
  await flushSignupOutbox();
}

import type { Locale } from "./i18n";
import {
  loadOutbox,
  removeOutboxEntry,
  saveOutbox,
  type SignupOutboxEntry,
} from "./kiosk-storage";
import { SUPABASE_ANON_KEY, SUPABASE_SIGNUPS_URL } from "./supabase-config";

export const SIGNUP_SYNC_TIMEOUT_MS = 4000;

export type SignupPayload = {
  name: string;
  email: string;
  consent: boolean;
  language: Locale;
  postcode: string | null;
  source: string;
};

type PostResult = "ok" | "duplicate" | "failed";

function supabaseHeaders(): HeadersInit {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
}

export async function postSignupToSupabase(
  entry: SignupOutboxEntry,
): Promise<PostResult> {
  try {
    const res = await fetch(SUPABASE_SIGNUPS_URL, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({
        id: entry.localId,
        name: entry.name,
        email: entry.email,
        consent: entry.consent,
        language: entry.language,
        postcode: entry.postcode,
        source: entry.source,
      }),
    });
    if (res.ok) return "ok";
    if (res.status === 409) return "duplicate";
    return "failed";
  } catch {
    return "failed";
  }
}

function settleOutboxEntry(entry: SignupOutboxEntry): Promise<PostResult> {
  return postSignupToSupabase(entry).then((result) => {
    if (result === "ok" || result === "duplicate") {
      removeOutboxEntry(entry.localId);
    }
    return result;
  });
}

export async function flushSignupOutbox(): Promise<number> {
  const outbox = loadOutbox();
  if (outbox.length === 0) return 0;

  const remaining: SignupOutboxEntry[] = [];
  for (const entry of outbox) {
    const result = await postSignupToSupabase(entry);
    if (result !== "ok" && result !== "duplicate") {
      remaining.push(entry);
    }
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

/** Queue locally first, try Supabase (max ~4s wait), then background retry. */
export async function submitSignupOptimistic(
  payload: SignupPayload,
): Promise<void> {
  const entry = enqueueSignupOutbox(payload);
  const sync = settleOutboxEntry(entry);

  const raced = await Promise.race([
    sync.then(() => "done" as const),
    new Promise<"timeout">((resolve) => {
      window.setTimeout(() => resolve("timeout"), SIGNUP_SYNC_TIMEOUT_MS);
    }),
  ]);

  if (raced === "timeout") {
    void sync;
  }
}

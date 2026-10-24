import { en } from "./en";
import { nl, type Messages } from "./nl";

export type Locale = "nl" | "en";

export const messages: Record<Locale, Messages> = { nl, en };

export function t(locale: Locale): Messages {
  return messages[locale];
}

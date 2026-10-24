/** Append a single key from the name keyboard with Dutch-friendly auto-capitalisation. */
export function appendNameKey(current: string, key: string): string {
  const next =
    key.length === 1 && /[a-z]/.test(key) && shouldCapitalizeNext(current)
      ? key.toUpperCase()
      : key;
  return (current + next).slice(0, 80);
}

export function shouldCapitalizeNext(name: string): boolean {
  if (!name) return true;
  const last = name.charAt(name.length - 1);
  return last === " " || last === "-" || last === "'";
}

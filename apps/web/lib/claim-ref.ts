/**
 * A human-quotable claim reference, derived from the id.
 *
 * The form is "C-4482" — short enough to read down a phone to support,
 * where a 32-character Convex id would be transcribed wrong every time.
 *
 * Derived rather than stored, so it needs no column and cannot drift from the
 * id. It is **not** a secret and **not** a lookup key: the full id in the URL
 * remains the capability, and two claims could in principle share a short ref
 * without any consequence beyond a support agent asking for the link.
 */
export function shortRef(id: string): string {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 10_000
  return `C-${String(hash).padStart(4, "0")}`
}

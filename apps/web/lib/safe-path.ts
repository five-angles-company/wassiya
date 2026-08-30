/**
 * Narrow an untrusted "come back here afterwards" value to a same-site path.
 *
 * Two places need this and both are open-redirect surfaces if they skip it: the
 * language switch's `redirect_to` (a hidden form field) and sign-in's
 * `redirect_url` (a query parameter anyone can write into a link they send).
 *
 * The rule is that a path starts with exactly one `/`. `//evil.example` is a
 * protocol-relative URL — a browser reads it as an absolute address on another
 * origin — and `/\evil.example` is treated the same way by several engines, so
 * both are refused. Anything that fails becomes the home page rather than
 * throwing: a mangled link should land the reader somewhere real.
 */
export function safePath(value: string | undefined | null): string {
  if (typeof value !== "string" || value.length === 0) return "/"
  if (!value.startsWith("/")) return "/"
  if (value.startsWith("//") || value.startsWith("/\\")) return "/"
  return value
}

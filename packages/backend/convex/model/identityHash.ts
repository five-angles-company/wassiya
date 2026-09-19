// Identity numbers are compared, never stored — AGENTS.md "Escrowed release".
//
// Both sides of an heir match go through `identityNumberHash`: the number the
// owner registers for an heir (`heirs.add` / `heirs.update`) and every number
// Didit reads off the heir's document (`http.ts`). Change the normalisation
// here and every stored hash stops matching, so bump nothing silently.
//
// The number is not hashed with its country: Didit reports ISO alpha-3
// ("SAU") where the app uses alpha-2, and a mismatch there would fail a
// genuine heir. A match is also always against one named heir of one owner,
// so a cross-country collision cannot release anything by itself.

/** Uppercase, letters and digits only — "1 023-456 789" and "1023456789" agree. */
export function normalizeIdentityNumber(raw: string): string {
  return raw.toUpperCase().replace(/[^0-9A-Z]/g, "")
}

/**
 * HMAC-SHA256 under `IDENTITY_HASH_SECRET` (Convex deployment env), hex.
 * Keyed rather than a bare hash: national ID numbers are a small space, and an
 * unkeyed hash would be reversed by enumerating it.
 */
export async function identityNumberHash(raw: string): Promise<string> {
  const secret = process.env.IDENTITY_HASH_SECRET
  if (secret === undefined || secret.length < 32) {
    throw new Error(
      "IDENTITY_HASH_SECRET is not set on this deployment (npx convex env set)"
    )
  }
  const normalized = normalizeIdentityNumber(raw)
  if (normalized.length < 4) {
    throw new Error("Identity number is too short")
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(normalized))
  )
  return Array.from(mac, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

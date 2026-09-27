/**
 * Reading a sealed secret for the types that store a flat JSON object.
 *
 * `null` means "not this type's payload" — a rotated format, a hand-edited row.
 * A parser that got `null` must refuse rather than offer an empty form, which
 * would be an offer to overwrite what it could not read.
 */
export function readSecretObject(
  secret: string,
  /** At least one of these keys must be present for it to count as this type. */
  anyOf: readonly string[]
): Record<string, unknown> | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(secret)
  } catch {
    return null
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null
  }
  const data = parsed as Record<string, unknown>
  return anyOf.some((key) => key in data) ? data : null
}

export function readString(data: Record<string, unknown>, key: string): string {
  const value = data[key]
  return typeof value === "string" ? value : ""
}

/** "•••• 1234" — enough to recognise a number, not enough to be it. */
export function maskTail(value: string): string {
  const clean = value.trim()
  return clean.length <= 4 ? clean : `•••• ${clean.slice(-4)}`
}

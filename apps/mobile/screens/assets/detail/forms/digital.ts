/**
 * The digital-account payload, in both directions.
 *
 * ## Why read and write live in one file
 *
 * `secret-fields.ts` could only decode. Every wizard encoded its own payload
 * inline, so the two halves of each format sat in different files with nothing
 * tying them together — and the crypto wizard proves what that costs: its
 * phrase path writes `network` into a localised subtitle and `kind` nowhere at
 * all, which no decoder can undo. A format needs one home, and this is it.
 *
 * `screens/assets/new/account/index.tsx` is still the other writer. Until it is
 * moved onto {@link toDigitalPayload}, **these two must agree** — the JSON keys
 * below and the label format are copied from it verbatim, and changing one
 * without the other means creating and editing produce different rows.
 *
 * ## The round trip that is not symmetric
 *
 * The form holds recovery codes as one newline-delimited string, because that
 * is what a multi-line field edits. The payload stores them as a filtered
 * array, because that is what an heir reads. The join and the split are here so
 * neither side has to remember which shape it is holding.
 */
import type { AssetLabel } from "@workspace/crypto/label"

/** Mirrors the board's three options, in its order. */
export type Disposition = "handOver" | "delete" | "memorialise"

export const DISPOSITIONS: Disposition[] = ["handOver", "delete", "memorialise"]

export type DigitalForm = {
  service: string
  username: string
  password: string
  /** Newline-delimited for editing; an array once stored. */
  recovery: string
  twoFactor: string
  /** `null` only for a payload written before the field existed. */
  disposition: Disposition | null
}

export const EMPTY_DIGITAL: DigitalForm = {
  service: "",
  username: "",
  password: "",
  recovery: "",
  twoFactor: "",
  disposition: null,
}

/**
 * Decode a stored payload.
 *
 * Returns `null` when the blob is not the JSON this type writes — a rotated
 * format, a hand-edited row, a future version. The caller must not present an
 * empty form in that case: doing so would offer to overwrite a payload it could
 * not read, which is how an owner loses a password by opening a screen.
 */
export function parseDigital(raw: string): DigitalForm | null {
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    data = parsed as Record<string, unknown>
  } catch {
    return null
  }

  const str = (key: string): string =>
    typeof data[key] === "string" ? (data[key] as string) : ""

  const codes = Array.isArray(data.recoveryCodes)
    ? (data.recoveryCodes as unknown[]).filter(
        (line): line is string => typeof line === "string"
      )
    : []

  const disposition = str("disposition")

  return {
    service: str("service"),
    username: str("username"),
    password: str("password"),
    recovery: codes.join("\n"),
    twoFactor: str("twoFactor"),
    disposition: DISPOSITIONS.includes(disposition as Disposition)
      ? (disposition as Disposition)
      : null,
  }
}

/**
 * What the row needs to become. `labels` is the `assets/new/account`
 * dictionary — the subtitle is built from the same strings the wizard uses, so
 * an edited asset does not read differently from a created one.
 */
export function toDigitalPayload(
  form: DigitalForm,
  labels: Record<string, string>
): { secret: string; label: AssetLabel; meta: Record<string, never> } {
  return {
    label: {
      title: `${form.service.trim()} · ${form.username.trim()}`,
      subtitle: `${labels.title} · ${dispositionLabel(form.disposition, labels)}`,
    },
    // One blob holding everything an heir needs, as JSON. The disposition
    // travels *inside* the ciphertext: it is an instruction about the owner's
    // account, and the server has no business reading it.
    secret: JSON.stringify({
      service: form.service.trim(),
      username: form.username.trim(),
      password: form.password,
      recoveryCodes: form.recovery
        .split(/\s*\n\s*/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
      twoFactor: form.twoFactor.trim(),
      disposition: form.disposition,
    }),
    meta: {},
  }
}

/** The wizard's own gate, so an edit cannot save what a create would refuse. */
export function isDigitalValid(form: DigitalForm): boolean {
  return (
    form.service.trim().length > 0 &&
    form.username.trim().length > 0 &&
    form.password.length > 0 &&
    form.disposition !== null
  )
}

export function dispositionLabel(
  disposition: Disposition | null,
  labels: Record<string, string>
): string {
  if (disposition === null) return ""
  return {
    handOver: labels.dispositionHandOver!,
    delete: labels.dispositionDelete!,
    memorialise: labels.dispositionMemorialise!,
  }[disposition]
}

/** How many recovery codes the field currently holds — the collapsed summary. */
export function recoveryCount(recovery: string): number {
  return recovery.split(/\s*\n\s*/).filter((line) => line.trim().length > 0)
    .length
}

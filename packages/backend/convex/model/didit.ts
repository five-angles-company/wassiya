// Reading a Didit verdict into what this deployment stores.
//
// ⚠️ **The approval webhook usually carries no document block.** Didit sends
// several webhooks per session, and the one that says "Approved" arrived with
// `id_verification` absent — so name, birth date and document numbers were
// never stored, staff had nothing to compare and an executor's ID number could
// never match. `verifiedDocument` therefore falls back to the decision API
// whenever a verified payload lacks the block. Confirmed against a real
// decision: `id_verification.{full_name, date_of_birth, document_number,
// personal_number, document_type}`.
//
// Document numbers leave this file only as keyed hashes (`identityHash.ts`).
import { identityNumberHash } from "./identityHash"

const DEFAULT_SESSION_URL = "https://verification.didit.me/v2/session/"

export type VerifiedDocument = {
  verifiedName?: string
  docType?: string
  docHashes?: string[]
  birthDate?: string
}

/** A field is usable only if it really is a string. Anything else is dropped. */
export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined
}

/** The document block, at the top level (v2) or under `decision` (older). */
export function idVerificationOf(
  body: Record<string, unknown>
): Record<string, unknown> {
  const direct = body.id_verification
  if (typeof direct === "object" && direct !== null) {
    return direct as Record<string, unknown>
  }
  const decision = body.decision
  if (typeof decision !== "object" || decision === null) return {}
  const nested = (decision as Record<string, unknown>).id_verification
  return typeof nested === "object" && nested !== null
    ? (nested as Record<string, unknown>)
    : {}
}

/**
 * The verified legal name, which a death certificate is later compared
 * against — so a wrong value here is load-bearing. Prefer `full_name`.
 */
function verifiedNameOf(v: Record<string, unknown>): string | undefined {
  const fullName = asString(v.full_name)
  if (fullName !== undefined) return fullName
  const composed = [asString(v.first_name), asString(v.last_name)]
    .filter((part): part is string => part !== undefined)
    .join(" ")
  return composed === "" ? undefined : composed
}

/**
 * Keyed hashes of every identity number on the document. A national number
 * sits in `personal_number` on some documents and `document_number` on others,
 * so both are kept and an executor matches either. A missing secret must not fail
 * the webhook — the verdict would never land — so it degrades to none.
 */
async function documentNumberHashes(
  v: Record<string, unknown>
): Promise<string[] | undefined> {
  const numbers = [asString(v.document_number), asString(v.personal_number)]
    .filter((value): value is string => value !== undefined)
  if (numbers.length === 0) return undefined
  try {
    return [...new Set(await Promise.all(numbers.map(identityNumberHash)))]
  } catch (error) {
    console.error(
      "Identity numbers not hashed:",
      error instanceof Error ? error.message : "unknown error"
    )
    return undefined
  }
}

/** The session's decision from Didit's API, or `{}` when it cannot be read. */
async function fetchDecisionBlock(
  sessionId: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.DIDIT_API_KEY
  if (apiKey === undefined) return {}
  const base = (process.env.DIDIT_API_URL ?? DEFAULT_SESSION_URL).replace(/\/?$/, "/")
  const response = await fetch(
    `${base}${encodeURIComponent(sessionId)}/decision/`,
    { headers: { "x-api-key": apiKey } }
  )
  if (!response.ok) {
    console.error(`Didit decision fetch failed (${response.status})`)
    return {}
  }
  const body: unknown = await response.json()
  return typeof body === "object" && body !== null
    ? idVerificationOf(body as Record<string, unknown>)
    : {}
}

/**
 * What to store for a verdict. `payloadBlock` is the webhook's own block; when
 * the verdict is "verified" and that block is empty, the decision API fills it.
 */
export async function verifiedDocument(
  sessionId: string,
  verified: boolean,
  payloadBlock: Record<string, unknown>
): Promise<VerifiedDocument> {
  const block: Record<string, unknown> =
    verified && asString(payloadBlock.full_name) === undefined
      ? await fetchDecisionBlock(sessionId).catch((): Record<string, unknown> => ({}))
      : payloadBlock
  return {
    verifiedName: verifiedNameOf(block),
    docType: asString(block.document_type),
    docHashes: await documentNumberHashes(block),
    birthDate: asString(block.date_of_birth),
  }
}

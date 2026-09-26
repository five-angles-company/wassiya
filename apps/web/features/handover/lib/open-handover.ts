import type { api } from "@workspace/backend/api"
import { decryptAsset } from "@workspace/crypto/asset"
import { openLabel } from "@workspace/crypto/label"
import { decodeExecutorCode, decodePaperCode, paperCodeKind } from "@workspace/crypto/papercode"
import { recoverMk } from "@workspace/crypto/recovery"
import {
  unwrapDekFromHandover,
  unwrapReleaseKeyForExecutor,
  unwrapReleaseKeyForOwner,
} from "@workspace/crypto/release"
import { openSecret } from "@workspace/crypto/secret"
import type { FunctionReturnType } from "convex/server"

/**
 * The crypto half of the handover, kept out of the components.
 *
 * ⚠️ The typed code is key material. It is decoded here and nowhere else, never
 * sent to the server, never logged, never stored — and the errors the decoders
 * throw are swallowed into a reason code, not shown or reported. Every key this
 * module derives is zeroed as soon as the next one is out of it; only the DEKs
 * survive, for as long as the handover is on screen.
 *
 * Convex serialises `v.bytes()` to `ArrayBuffer`, and every function in
 * `@workspace/crypto` asserts on `Uint8Array`, so each crossing is wrapped once,
 * here.
 */

export type HandoverResponse = FunctionReturnType<typeof api.handover.open>

/** Which printed sheets can open this handover at all. */
export type SheetsOnRecord = { executor: boolean; recovery: boolean }

export function sheetsOnRecord(response: HandoverResponse): SheetsOnRecord {
  return { executor: response.sheet !== null, recovery: response.fallback !== null }
}

/** Why a typed code opened nothing. Each one has its own sentence. */
export type UnlockFailure =
  | "unreadable"
  | "executorReplaced"
  | "recoveryReplaced"
  | "noExecutorSheet"
  | "noRecoverySheet"
  | "wrongSheet"

export type UnlockResult =
  | { status: "open"; handover: OpenedHandover }
  | { status: "failed"; reason: UnlockFailure }

/** One secret field, as the owner's app wrote it. */
export type SecretField = { key: string; value: string }

export type OpenedItem = {
  assetId: string
  type: string
  /** `null` when the item's key did not open. */
  title: string | null
  subtitle?: string
  byteSize?: number
  mimeType?: string
  fields: SecretField[]
  fileUrls: string[]
  dek?: Uint8Array
}

export type OpenedHandover = {
  expiresAt: number
  items: OpenedItem[]
}

/** Keys that describe the secret rather than carry it, and the note's title. */
const HIDDEN_FIELDS = new Set(["format", "durationMs", "title"])

/**
 * The executor's own sheet first; the owner's recovery sheet as the fallback.
 * The prefix only says which kind the reader *meant* — the checksum and then
 * the AEAD decide whether it is one.
 */
export function unlockHandover(response: HandoverResponse, code: string): UnlockResult {
  const kind = paperCodeKind(code)
  if (kind === null) return failed("unreadable")

  const released =
    kind === "executor" ? releaseKeyFromExecutorSheet(response, code) : releaseKeyFromRecoverySheet(response, code)
  if (typeof released === "string") return failed(released)

  try {
    return { status: "open", handover: openItems(response, released) }
  } finally {
    released.fill(0)
  }
}

function releaseKeyFromExecutorSheet(response: HandoverResponse, code: string): Uint8Array | UnlockFailure {
  let decoded: ReturnType<typeof decodeExecutorCode>
  try {
    decoded = decodeExecutorCode(code)
  } catch {
    return "unreadable"
  }
  try {
    const sheet = response.sheet
    if (sheet === null) return "noExecutorSheet"
    // The version is bound into the wrapper, so an older sheet cannot open it
    // and deserves to be named as older rather than as wrong.
    if (decoded.version < sheet.version) return "executorReplaced"
    if (decoded.version !== sheet.version) return "wrongSheet"
    return unwrapReleaseKeyForExecutor(new Uint8Array(sheet.releaseKeyWrapped), decoded.sheetSecret, {
      ownerId: response.ownerId,
      executorId: response.executorId,
      sheetVersion: sheet.version,
    })
  } catch {
    return "wrongSheet"
  } finally {
    decoded.sheetSecret.fill(0)
  }
}

function releaseKeyFromRecoverySheet(response: HandoverResponse, code: string): Uint8Array | UnlockFailure {
  let decoded: ReturnType<typeof decodePaperCode>
  try {
    decoded = decodePaperCode(code)
  } catch {
    return "unreadable"
  }
  let mk: Uint8Array | null = null
  try {
    const fallback = response.fallback
    if (fallback === null) return "noRecoverySheet"
    if (decoded.version < fallback.paperVersion) return "recoveryReplaced"
    if (decoded.version !== fallback.paperVersion) return "wrongSheet"
    // The AAD is rebuilt from the *stored* paper version — see
    // `@workspace/crypto/recovery`.
    mk = recoverMk(decoded.sPaper, new Uint8Array(fallback.mkWrappedByRecovery), response.ownerId, fallback.paperVersion)
    return unwrapReleaseKeyForOwner(new Uint8Array(fallback.releaseKeyWrappedByMk), mk, response.ownerId)
  } catch {
    return "wrongSheet"
  } finally {
    mk?.fill(0)
    decoded.sPaper.fill(0)
  }
}

function openItems(response: HandoverResponse, releaseKey: Uint8Array): OpenedHandover {
  const items = response.items.map((item): OpenedItem => {
    const base = {
      assetId: item.assetId,
      type: item.type,
      byteSize: item.meta.byteSize,
      mimeType: item.meta.mimeType,
      fileUrls: item.files.flatMap((file) => (file.url === null ? [] : [file.url])),
    }
    let dek: Uint8Array | undefined
    try {
      dek = unwrapDekFromHandover(new Uint8Array(item.dekWrappedByRelease), releaseKey, {
        ownerId: response.ownerId,
        assetId: item.assetId,
      })
      const label = openLabel(new Uint8Array(item.labelSealed), dek)
      const fields = item.secretSealed === null ? [] : fieldsOf(openSecret(new Uint8Array(item.secretSealed), dek))
      return { ...base, title: label.title, subtitle: label.subtitle, fields, dek }
    } catch {
      dek?.fill(0)
      return { ...base, title: null, fields: [] }
    }
  })
  // Items the executor can name come first; one that did not open is not the
  // first thing they should see.
  items.sort((a, b) => Number(a.title === null) - Number(b.title === null))
  return { expiresAt: response.expiresAt, items }
}

function failed(reason: UnlockFailure): UnlockResult {
  return { status: "failed", reason }
}

/** The secret's JSON as displayable fields, in the order it was written. */
function fieldsOf(secret: string): SecretField[] {
  const parsed: unknown = JSON.parse(secret)
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return []
  }
  const fields: SecretField[] = []
  for (const [key, raw] of Object.entries(parsed)) {
    if (HIDDEN_FIELDS.has(key)) continue
    const value = Array.isArray(raw) ? raw.join("\n") : raw
    if (typeof value === "string" && value.trim().length > 0) {
      fields.push({ key, value })
    }
  }
  return fields
}

/** Fetch one file's ciphertext and decrypt it — each file is framed on its own. */
export async function fetchAndDecrypt(url: string, dek: Uint8Array): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`File fetch failed: ${response.status}`)
  return decryptAsset(new Uint8Array(await response.arrayBuffer()), dek)
}

/** Zero every key the handover holds. Called when it leaves the screen. */
export function wipeHandover(opened: OpenedHandover | null): void {
  if (opened === null) return
  for (const item of opened.items) item.dek?.fill(0)
}

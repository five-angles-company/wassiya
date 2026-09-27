import type { api } from "@workspace/backend/api"
import { createAssetDecryptor } from "@workspace/crypto/asset"
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

/** One downloadable file; `mimeType` is its own when the owner's app recorded one. */
export type OpenedFile = { url: string; mimeType?: string }

export type OpenedItem = {
  assetId: string
  type: string
  /** `null` when the item's key did not open. */
  title: string | null
  subtitle?: string
  byteSize?: number
  mimeType?: string
  fields: SecretField[]
  files: OpenedFile[]
  dek?: Uint8Array
}

export type OpenedHandover = {
  expiresAt: number
  items: OpenedItem[]
}

/** Keys that describe the secret or its files rather than carry it, and the note's title. */
const HIDDEN_FIELDS = new Set(["format", "durationMs", "title", "items"])

/** The encoded body after `WSE1`/`WSY1` — fixed by the printed format in `@workspace/crypto/papercode`. */
const CODE_BODY_CHARS = 56
const GROUP = 4

/**
 * What the reader typed, in the form the decoders accept. A phone set to Arabic
 * types ٢ for 2, and a code copied out of a message app arrives with its
 * hyphens turned into dashes; neither is a mistake worth failing on. Anything
 * else is left for the checksum to catch.
 */
export function normaliseTypedCode(code: string): string {
  return code
    .replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) & 0xf))
    .replace(/[\s\-‐-―−_.·•]/g, "")
    .toUpperCase()
}

/**
 * How much of the code is typed, once it is recognisably a sheet code — so a
 * reader copying off paper can see a skipped group before they press Open.
 */
export function typedCodeProgress(code: string): { typed: number; total: number } | null {
  const normalised = normaliseTypedCode(code)
  if (paperCodeKind(normalised) === null) return null
  // Prefix (3) and a one-digit version; a longer version only shows once the
  // whole body is there.
  const typed = Math.max(0, normalised.length - 4)
  return { typed: Math.min(typed, CODE_BODY_CHARS), total: CODE_BODY_CHARS }
}

/**
 * The code regrouped the way the sheet prints it (`WSE1-ABCD-…`), so it can be
 * checked against the paper group by group. Left alone if it is not a sheet
 * code yet.
 */
export function formatTypedCode(code: string): string {
  const normalised = normaliseTypedCode(code)
  if (paperCodeKind(normalised) === null) return code
  const headLength = Math.max(4, normalised.length - CODE_BODY_CHARS)
  const groups = [normalised.slice(0, headLength)]
  for (let i = headLength; i < normalised.length; i += GROUP) {
    groups.push(normalised.slice(i, i + GROUP))
  }
  return groups.join("-")
}

/**
 * The executor's own sheet first; the owner's recovery sheet as the fallback.
 * The prefix only says which kind the reader *meant* — the checksum and then
 * the AEAD decide whether it is one.
 */
export function unlockHandover(response: HandoverResponse, typed: string): UnlockResult {
  const code = normaliseTypedCode(typed)
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
    }
    let dek: Uint8Array | undefined
    try {
      dek = unwrapDekFromHandover(new Uint8Array(item.dekWrappedByRelease), releaseKey, {
        ownerId: response.ownerId,
        assetId: item.assetId,
      })
      const label = openLabel(new Uint8Array(item.labelSealed), dek)
      const secret = item.secretSealed === null ? null : openSecret(new Uint8Array(item.secretSealed), dek)
      return {
        ...base,
        title: label.title,
        subtitle: label.subtitle,
        fields: secret === null ? [] : fieldsOf(secret),
        files: filesOf(item.files, secret === null ? [] : fileTypesOf(secret)),
        dek,
      }
    } catch {
      dek?.fill(0)
      return { ...base, title: null, fields: [], files: filesOf(item.files, []) }
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

/**
 * An album records each file's type in its secret, in file order; the other
 * types record none. Positional, so it pairs with the files before any is
 * dropped for a missing url.
 */
function fileTypesOf(secret: string): (string | undefined)[] {
  const parsed: unknown = JSON.parse(secret)
  const items = typeof parsed === "object" && parsed !== null ? (parsed as { items?: unknown }).items : undefined
  if (!Array.isArray(items)) return []
  return items.map((entry: unknown) => {
    const mimeType = typeof entry === "object" && entry !== null ? (entry as { mimeType?: unknown }).mimeType : undefined
    return typeof mimeType === "string" ? mimeType : undefined
  })
}

function filesOf(files: HandoverResponse["items"][number]["files"], types: (string | undefined)[]): OpenedFile[] {
  return files.flatMap((file, i) => (file.url === null ? [] : [{ url: file.url, mimeType: types[i] }]))
}

/** How far a download has got, as a fraction; `null` when the size is unknown. */
export type OnProgress = (fraction: number | null) => void

/**
 * Fetch one file and decrypt it as it streams in — each file is framed on its
 * own — handing each plaintext chunk to `write` as it is authenticated.
 */
async function streamDecrypted(
  url: string,
  dek: Uint8Array,
  write: (chunk: Uint8Array) => unknown,
  onProgress: OnProgress
): Promise<void> {
  const response = await fetch(url)
  if (!response.ok || response.body === null) throw new Error(`File fetch failed: ${response.status}`)
  const length = Number(response.headers.get("Content-Length"))
  const total = Number.isFinite(length) && length > 0 ? length : null
  const decryptor = createAssetDecryptor(dek)
  const reader = response.body.getReader()
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    onProgress(total === null ? null : Math.min(received / total, 1))
    for (const part of decryptor.push(value)) await write(part)
  }
  await write(decryptor.finish())
}

/**
 * The whole file as a `Blob`, built chunk by chunk, so it is never held as
 * ciphertext and plaintext at once.
 */
export async function fetchAndDecrypt(
  url: string,
  dek: Uint8Array,
  type: string,
  onProgress: OnProgress
): Promise<Blob> {
  const parts: Uint8Array[] = []
  await streamDecrypted(url, dek, (part) => parts.push(part), onProgress)
  return new Blob(parts as Uint8Array<ArrayBuffer>[], { type })
}

/**
 * Straight into a file the reader picked, where the browser allows it: a long
 * video goes to disk as it decrypts instead of filling the tab's memory. A
 * failure part-way discards the file rather than leaving half of it behind.
 */
export async function decryptToFile(
  url: string,
  dek: Uint8Array,
  handle: FileSystemFileHandle,
  onProgress: OnProgress
): Promise<void> {
  const writable = await handle.createWritable()
  try {
    await streamDecrypted(url, dek, (part) => writable.write(part as Uint8Array<ArrayBuffer>), onProgress)
    await writable.close()
  } catch (cause) {
    await writable.abort().catch(() => undefined)
    throw cause
  }
}

/** Zero every key the handover holds. Called when it leaves the screen. */
export function wipeHandover(opened: OpenedHandover | null): void {
  if (opened === null) return
  for (const item of opened.items) item.dek?.fill(0)
}

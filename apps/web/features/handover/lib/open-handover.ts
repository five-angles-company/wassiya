import { decryptAsset } from "@workspace/crypto/asset"
import { openLabel } from "@workspace/crypto/label"
import { openSecret } from "@workspace/crypto/secret"

/**
 * The crypto half of the box, kept out of the components.
 *
 * `escrow.openDelivery` returns every item routed to this heir with its DEK.
 * Everything is opened here, in the browser: the name, the secret fields, and
 * each file on demand. The DEKs live as long as the box is on screen and are
 * zeroed when it closes.
 *
 * Convex serialises `v.bytes()` to `ArrayBuffer`, and every function in
 * `@workspace/crypto` asserts on `Uint8Array`, so each crossing is wrapped once,
 * here.
 */

/** What `escrow.openDelivery` returns, as this module needs it. */
export type DeliveryResponse = {
  expiresAt: number
  items: {
    assetId: string
    type: string
    via: string
    meta: { byteSize?: number; mimeType?: string }
    labelSealed: ArrayBuffer
    secretSealed: ArrayBuffer | null
    files: { url: string | null; thumbnailUrl: string | null }[]
    dek: ArrayBuffer | null
  }[]
  message: { kind: string; url: string | null; key: ArrayBuffer | null } | null
}

/** One secret field, as the owner's app wrote it. */
export type SecretField = { key: string; value: string }

export type OpenedItem = {
  assetId: string
  type: string
  via: string
  /** `null` when the item's key did not open. */
  title: string | null
  subtitle?: string
  byteSize?: number
  mimeType?: string
  fields: SecretField[]
  fileUrls: string[]
  dek?: Uint8Array
}

export type OpenedDelivery = {
  expiresAt: number
  items: OpenedItem[]
  message: { url: string; key: Uint8Array } | null
}

/** Keys that describe the secret rather than carry it, and the note's title. */
const HIDDEN_FIELDS = new Set(["format", "durationMs", "title"])

export function openDeliveryResponse(response: DeliveryResponse): OpenedDelivery {
  const items = response.items.map((item): OpenedItem => {
    const dek = item.dek === null ? undefined : new Uint8Array(item.dek)
    const base = {
      assetId: item.assetId,
      type: item.type,
      via: item.via,
      byteSize: item.meta.byteSize,
      mimeType: item.meta.mimeType,
      fileUrls: item.files.flatMap((file) => (file.url === null ? [] : [file.url])),
    }
    if (dek === undefined) return { ...base, title: null, fields: [] }
    try {
      const label = openLabel(new Uint8Array(item.labelSealed), dek)
      const fields =
        item.secretSealed === null
          ? []
          : fieldsOf(openSecret(new Uint8Array(item.secretSealed), dek))
      return { ...base, title: label.title, subtitle: label.subtitle, fields, dek }
    } catch {
      dek.fill(0)
      return { ...base, title: null, fields: [] }
    }
  })
  // Items this heir can name come first; one that did not open is not the
  // first thing they should see.
  items.sort((a, b) => Number(a.title === null) - Number(b.title === null))

  const message = response.message
  return {
    expiresAt: response.expiresAt,
    items,
    message:
      message === null || message.url === null || message.key === null
        ? null
        : { url: message.url, key: new Uint8Array(message.key) },
  }
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

/** Zero every key the box holds. Called when the box leaves the screen. */
export function wipeDelivery(opened: OpenedDelivery | null): void {
  if (opened === null) return
  for (const item of opened.items) item.dek?.fill(0)
  opened.message?.key.fill(0)
}

/**
 * The document "payload", which is not a payload at all: ٤.٥ stores a file, and
 * everything readable about it lives in the row's plaintext `meta` with the name
 * in the sealed label. So this codec reads `EditSource.meta`, and the edit
 * screen never downloads the document to render its own form.
 *
 * `kind` is stored in a small blob ahead of the file, making `storageIds`
 * `[kind, file]` on anything saved from now on and plain `[file]` on everything
 * saved before. Both are read here, and one blob means a legacy row whose kind
 * was never recorded — the chips say so rather than asserting "deed", the same
 * rule the crypto phrase follows and for the same reason.
 */
import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"

/** A file chosen on this screen, not yet encrypted. */
export type PickedFile = {
  uri: string
  name: string
  size: number
  mimeType: string
}

export const DOCUMENT_KINDS = ["deed", "marriage", "certificate", "other"]

export type DocumentForm = {
  title: string
  /** `""` on a row saved before ٤.٥ recorded it — never defaulted to "deed". */
  kind: string
  /** `null` keeps the stored file untouched. */
  replacement: PickedFile | null
  /** What the row currently holds, for the row that shows it. */
  current: { byteSize: number; mimeType: string }
  /** The file blob, which survives every edit that does not replace it. */
  fileIds: string[]
}

export function parseDocument({
  secret,
  title,
  meta,
  storageIds,
}: EditSource): DocumentForm {
  // One blob is a legacy row: the file, and no kind was ever written.
  const hasPayload = storageIds.length > 1
  let kind = ""
  if (hasPayload) {
    try {
      const parsed: unknown = JSON.parse(secret)
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const value = (parsed as Record<string, unknown>).kind
        if (typeof value === "string") kind = value
      }
    } catch {
      /* a rotated format; the chips stay unset rather than guessing */
    }
  }

  return {
    title,
    kind,
    replacement: null,
    current: {
      byteSize: meta.byteSize ?? 0,
      mimeType: meta.mimeType ?? "application/octet-stream",
    },
    fileIds: hasPayload ? storageIds.slice(1) : storageIds,
  }
}

export function toDocumentPayload(
  form: DocumentForm,
  formatSize: (bytes: number) => string
): EditPayload {
  const file = form.replacement
  const byteSize = file?.size ?? form.current.byteSize
  const mimeType = file?.mimeType ?? form.current.mimeType

  return {
    label: {
      title: form.title.trim(),
      subtitle: `${describeType(mimeType)} · ${formatSize(byteSize)}`,
    },
    // Written on every save, which is also what migrates a legacy row onto the
    // two-blob layout the moment its owner next touches it.
    secret: JSON.stringify({ kind: form.kind }),
    meta: { itemCount: 1, byteSize, mimeType },
  }
}

export function describeType(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF"
  if (mimeType.startsWith("image/")) return mimeType.slice(6).toUpperCase()
  return "FILE"
}

export function isDocumentValid(form: DocumentForm): boolean {
  return form.title.trim().length > 0
}

/** The file picker's own name, offered as a title but never over a typed one. */
export function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(0, dot) : name
}

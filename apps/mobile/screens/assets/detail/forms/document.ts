/**
 * The document form. The file is the asset's one stored file and is never
 * downloaded to edit it: everything readable about it lives in the row's
 * plaintext `meta`, the name in the sealed label, and the kind in the sealed
 * secret.
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
  kind: string
  /** `null` keeps the stored file untouched. */
  replacement: PickedFile | null
  /** What the row currently holds, for the row that shows it. */
  current: { byteSize: number; mimeType: string }
}

export function parseDocument({ secret, title, meta }: EditSource): DocumentForm {
  let kind = ""
  try {
    const parsed: unknown = JSON.parse(secret)
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const value = (parsed as Record<string, unknown>).kind
      if (typeof value === "string") kind = value
    }
  } catch {
    /* the chips stay unset rather than guessing */
  }

  return {
    title,
    kind,
    replacement: null,
    current: {
      byteSize: meta.byteSize ?? 0,
      mimeType: meta.mimeType ?? "application/octet-stream",
    },
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

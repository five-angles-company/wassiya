/**
 * The document "payload", which is not a payload at all.
 *
 * ٤.٥ stores a file and no secret blob. Everything readable about it — the
 * count, the size, the mime type — is in the row's plaintext `meta`, and the
 * name is in the sealed label. So this codec reads `EditSource.meta` where the
 * others read `EditSource.secret`, and the edit screen never downloads the
 * document to render its own form.
 *
 * ## `kind` is not here, and that is deliberate
 *
 * The wizard renders a deed/marriage/certificate/other chooser and **never
 * submits it** — `save()` builds `label`, `files` and `meta` with no `kind`
 * anywhere. Carrying that control onto the edit screen would reproduce a
 * decision the vault does not keep: the owner would set it, save, reopen, and
 * find it back at its default. A row that cannot remember what it was told does
 * not belong on a screen whose whole job is to remember.
 *
 * Storing it properly would mean giving this type a secret blob, which changes
 * the `storageIds` layout for every document already saved. That is a migration
 * with its own plan, not a field to slip into an edit form.
 */
import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"

/** A file chosen on this screen, not yet encrypted. */
export type PickedFile = {
  uri: string
  name: string
  size: number
  mimeType: string
}

export type DocumentForm = {
  title: string
  /** `null` keeps the stored file untouched. */
  replacement: PickedFile | null
  /** What the row currently holds, for the row that shows it. */
  current: { byteSize: number; mimeType: string }
}

export function parseDocument({ title, meta }: EditSource): DocumentForm {
  return {
    title,
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

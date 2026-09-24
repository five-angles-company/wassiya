import type { Id } from "@workspace/backend/dataModel"

export type UploadedAttachment = { storageId: Id<"_storage">; name: string }

/**
 * POST each file to its own upload URL. The backend checks type and size again
 * when the message is sent; `accept` on the picker is only a courtesy.
 */
export async function uploadAll(
  files: File[],
  uploadUrl: () => Promise<string>
): Promise<UploadedAttachment[]> {
  const out: UploadedAttachment[] = []
  for (const file of files) {
    const response = await fetch(await uploadUrl(), {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    })
    if (!response.ok) throw new Error(`Upload failed (${response.status})`)
    const { storageId } = (await response.json()) as {
      storageId: Id<"_storage">
    }
    out.push({ storageId, name: file.name })
  }
  return out
}

export const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,application/pdf"

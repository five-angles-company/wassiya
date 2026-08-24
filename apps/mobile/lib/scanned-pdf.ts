/**
 * Scanned pages → one PDF, entirely on the device.
 *
 * 4.5: *"pages are encrypted individually and assembled into one PDF
 * client-side. No OCR to any server."* The assembly is the part that has to
 * happen here rather than anywhere else — a deed photographed in three parts is
 * one document, and shipping three loose images would leave an heir to work out
 * the order.
 *
 * `expo-print` is the tool, and it is already how this app makes its recovery
 * sheet: HTML rendered to a PDF in a local WebView. Nothing is fetched, so
 * nothing leaves the device.
 *
 * **Pages are embedded as base64 data URIs, not `file://` paths.** The print
 * WebView resolves relative to its own origin, and a `file://` src fails
 * silently — producing a PDF of the right page count with every page blank.
 * The recovery sheet hit the same wall with its QR and its font; this follows
 * that established shape.
 */
import { File } from "expo-file-system"
import { printToFileAsync } from "expo-print"

/** A4 at 72dpi, which is what the print WebView lays out against. */
const PAGE_CSS = `
  @page { margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .page {
    width: 100%; height: 100vh;
    display: flex; align-items: center; justify-content: center;
    page-break-after: always; overflow: hidden;
  }
  .page:last-child { page-break-after: auto; }
  img { max-width: 100%; max-height: 100%; object-fit: contain; }
`

/**
 * Build a single-file PDF from scanned page images and return its local uri.
 *
 * The caller owns what happens next — in this app that is read, encrypt,
 * upload, delete. The PDF is written to the cache directory by `expo-print`
 * and is **plaintext**, so it must not outlive the encrypt step; callers
 * delete it once the ciphertext exists.
 */
export async function buildScannedPdf(imageUris: string[]): Promise<string> {
  if (imageUris.length === 0) {
    throw new Error("A scanned document needs at least one page")
  }

  const pages: string[] = []
  for (const uri of imageUris) {
    // Sequential: a ten-page scan resolved at once holds ten base64 strings —
    // each ~4/3 the size of its image — in memory simultaneously.
    const base64 = await new File(uri).base64()
    pages.push(
      `<div class="page"><img src="data:image/jpeg;base64,${base64}" /></div>`
    )
  }

  const { uri } = await printToFileAsync({
    html: `<html><head><meta charset="utf-8"><style>${PAGE_CSS}</style></head><body>${pages.join("")}</body></html>`,
    base64: false,
  })
  return uri
}

/** Delete a plaintext scan artefact. Safe to call on something already gone. */
export function discardScan(uri: string): void {
  const file = new File(uri)
  if (file.exists) file.delete()
}

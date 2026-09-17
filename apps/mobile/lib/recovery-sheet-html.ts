/**
 * The printed recovery document, as HTML for `expo-print`. It is a legal
 * artefact people keep with a notarised will for decades, so three things
 * matter more than they would on a screen:
 *
 *  - **Fonts travel with it.** `expo-print` renders in a WebView that knows
 *    nothing about the app's `expo-font` registrations and may have no network,
 *    so Cairo is read out of the bundle and inlined as a data URI. Body copy
 *    falls back to the platform Arabic face on purpose — legible everywhere,
 *    and a second 226 KB face is not worth the memory on a page that is mostly
 *    a monospace code.
 *  - **The code must never be reflowed or reshaped.** Latin, monospace, inside
 *    an explicit `dir="ltr"` block; Arabic-Indic digits or bidi reordering would
 *    make a sheet that cannot be typed back in.
 *  - **Owner-supplied text is escaped.** The name and email come from a person
 *    and land in markup, and `escapeHtml` is what stops a stray `<` from
 *    silently eating the rest of the document.
 */
import { Asset } from "expo-asset"
import { File } from "expo-file-system"
import { Cairo_900Black } from "@expo-google-fonts/cairo"
import { fmtDate } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"

export type RecoverySheetLabels = {
  documentTitle: string
  documentSubtitle: string
  codeLabel: string
  owner: string
  account: string
  issued: string
  version: string
  shownOnce: string
  handling: string
  keepWithWill: string
}

export type RecoverySheetData = {
  /** The paper code split on its hyphens: ["WSY1", "K7M2", …] — 15 groups. */
  codeGroups: string[]
  /** PNG data URI of the wrapped-key QR, or null if it could not be rendered. */
  qrDataUri: string | null
  ownerName: string
  accountEmail: string
  issuedAt: Date
  paperVersion: number
  locale: Locale
  labels: RecoverySheetLabels
}

/** Cached across calls: the user may print, then save, then share. */
let cairoDataUri: string | null | undefined

/**
 * Base64 of the bundled Cairo 900 face, or null if it cannot be read.
 *
 * A failure here is cosmetic — the sheet still prints correctly in the system
 * Arabic face — so it is swallowed rather than surfaced. Losing the brand face
 * is not a reason to deny someone their recovery document.
 */
async function loadCairo(): Promise<string | null> {
  if (cairoDataUri !== undefined) return cairoDataUri
  try {
    const asset = Asset.fromModule(Cairo_900Black)
    await asset.downloadAsync()
    if (asset.localUri === null) {
      cairoDataUri = null
      return null
    }
    const base64 = await new File(asset.localUri).base64()
    cairoDataUri = `data:font/ttf;base64,${base64}`
  } catch {
    cairoDataUri = null
  }
  return cairoDataUri
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Three groups per line, matching the on-screen `recovery-code-display`. */
function codeLines(groups: string[], perLine = 3): string[] {
  const lines: string[] = []
  for (let i = 0; i < groups.length; i += perLine) {
    lines.push(groups.slice(i, i + perLine).join("  ·  "))
  }
  return lines
}

export async function buildRecoverySheetHtml(
  data: RecoverySheetData
): Promise<string> {
  const cairo = await loadCairo()
  const { labels: t } = data

  const fontFace =
    cairo === null
      ? ""
      : `@font-face{font-family:'Cairo';src:url('${cairo}') format('truetype');font-weight:900;font-style:normal;}`

  const heading =
    cairo === null
      ? `'Noto Naskh Arabic','Geeza Pro',serif`
      : `'Cairo','Noto Naskh Arabic',sans-serif`

  const qr =
    data.qrDataUri === null
      ? ""
      : `<img class="qr" src="${data.qrDataUri}" alt="" />`

  const code = codeLines(data.codeGroups)
    .map((line) => `<div class="code-line">${escapeHtml(line)}</div>`)
    .join("")

  return `<!DOCTYPE html>
<html dir="rtl" lang="${data.locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  ${fontFace}
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #ffffff;
    color: #201e1d;
    font-family: 'Noto Naskh Arabic', 'Geeza Pro', serif;
    font-size: 12pt;
    line-height: 1.7;
  }
  .sheet { border: 1.5pt solid #201e1d; border-radius: 6pt; padding: 10mm; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm; }
  h1 { font-family: ${heading}; font-weight: 900; font-size: 20pt; line-height: 1.2; margin: 0; }
  .subtitle { direction: ltr; text-align: left; font-size: 8pt; letter-spacing: .12em; color: #645c50; margin-top: 1mm; }
  .qr { width: 30mm; height: 30mm; flex: none; }
  hr { border: 0; border-top: .8pt solid #dcd3c4; margin: 6mm 0; }
  .label { font-size: 8.5pt; letter-spacing: .08em; color: #645c50; margin-bottom: 2mm; }
  /* The code is machine-readable text a human retypes: Latin, monospace, and
     explicitly LTR so no bidi rule can reorder a group. */
  .code { direction: ltr; text-align: left; font-family: 'Courier New', monospace; font-size: 14pt; font-weight: 700; letter-spacing: .08em; }
  .code-line { margin-bottom: 1.5mm; white-space: nowrap; }
  .meta { display: flex; flex-wrap: wrap; gap: 2mm 10mm; font-size: 10pt; }
  .meta div { min-width: 60mm; }
  .meta .k { color: #645c50; font-size: 8.5pt; }
  .meta .v { font-weight: 600; }
  .meta .ltr { direction: ltr; text-align: right; unicode-bidi: isolate; }
  .band { border: 1pt solid #8c491a; color: #8c491a; border-radius: 4pt; padding: 4mm 5mm; margin-top: 6mm; font-size: 10.5pt; }
  .band p { margin: 0 0 1.5mm; }
  .band p:last-child { margin-bottom: 0; }
  .foot { margin-top: 5mm; font-size: 9pt; color: #645c50; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <h1>${escapeHtml(t.documentTitle)}</h1>
        <div class="subtitle">${escapeHtml(t.documentSubtitle)}</div>
      </div>
      ${qr}
    </div>

    <hr />

    <div class="label">${escapeHtml(t.codeLabel)}</div>
    <div class="code">${code}</div>

    <hr />

    <div class="meta">
      <div>
        <div class="k">${escapeHtml(t.owner)}</div>
        <div class="v">${escapeHtml(data.ownerName)}</div>
      </div>
      <div>
        <div class="k">${escapeHtml(t.account)}</div>
        <div class="v ltr">${escapeHtml(data.accountEmail)}</div>
      </div>
      <div>
        <div class="k">${escapeHtml(t.issued)}</div>
        <div class="v">${escapeHtml(fmtDate(data.issuedAt, data.locale))}</div>
      </div>
      <div>
        <div class="k">${escapeHtml(t.version)}</div>
        <div class="v ltr">WSY${data.paperVersion}</div>
      </div>
    </div>

    <div class="band">
      <p>${escapeHtml(t.shownOnce)}</p>
      <p>${escapeHtml(t.handling)}</p>
    </div>

    <div class="foot">${escapeHtml(t.keepWithWill)}</div>
  </div>
</body>
</html>`
}

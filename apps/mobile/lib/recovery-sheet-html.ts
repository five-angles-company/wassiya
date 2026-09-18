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
  brandName: string
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
  howTitle: string
  howWhen: string
  howStep1: string
  howStep2: string
  howStep3: string
  qrCaption: string
  sheetFooter: string
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
let markDataUri: string | null | undefined

/**
 * Base64 of the ribbon mark, or null if it cannot be read.
 *
 * `assets/images/brand-mark.png`, not `assets/brand/` — Metro only bundles the
 * former, and the latter is the regeneration source (see its README). Cosmetic
 * on failure, like the font: a missing logo is not a reason to withhold
 * somebody's recovery document.
 */
async function loadMark(): Promise<string | null> {
  if (markDataUri !== undefined) return markDataUri
  try {
    // Metro resolves a static asset through `require`, which is how
    // `screens/splash` loads this same file; there is no import form that
    // yields the module id an `Asset` needs.
    const asset = Asset.fromModule(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../assets/images/brand-mark.png") as number
    )
    await asset.downloadAsync()
    if (asset.localUri === null) {
      markDataUri = null
      return null
    }
    const base64 = await new File(asset.localUri).base64()
    markDataUri = `data:image/png;base64,${base64}`
  } catch {
    markDataUri = null
  }
  return markDataUri
}

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
  const [cairo, mark] = await Promise.all([loadCairo(), loadMark()])
  const { labels: t } = data

  const fontFace =
    cairo === null
      ? ""
      : `@font-face{font-family:'Cairo';src:url('${cairo}') format('truetype');font-weight:900;font-style:normal;}`

  const heading =
    cairo === null
      ? `'Noto Naskh Arabic','Geeza Pro',serif`
      : `'Cairo','Noto Naskh Arabic',sans-serif`

  const logo =
    mark === null ? "" : `<img class="mark" src="${mark}" alt="" />`

  const qr =
    data.qrDataUri === null
      ? ""
      : `<figure class="qr">
          <img src="${data.qrDataUri}" alt="" />
          <figcaption>${escapeHtml(t.qrCaption)}</figcaption>
        </figure>`

  const code = codeLines(data.codeGroups)
    .map((line) => `<div class="code-line">${escapeHtml(line)}</div>`)
    .join("")

  const steps = [t.howStep1, t.howStep2, t.howStep3]
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("")

  const field = (key: string, value: string, ltr = false) =>
    `<div class="field">
       <div class="k">${escapeHtml(key)}</div>
       <div class="v${ltr ? " ltr" : ""}">${escapeHtml(value)}</div>
     </div>`

  return `<!DOCTYPE html>
<html dir="rtl" lang="${data.locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  ${fontFace}
  @page { size: A4; margin: 16mm 15mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #fff;
    color: #201e1d;
    font-family: 'Noto Naskh Arabic', 'Geeza Pro', serif;
    font-size: 11pt;
    line-height: 1.65;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Masthead. The rule under it is the only full-width brand colour on the
     page: everything else has to survive a monochrome printer, so nothing
     carries meaning by colour alone. */
  .masthead { display: flex; align-items: center; justify-content: space-between; gap: 8mm; }
  .brand { display: flex; align-items: center; gap: 3.5mm; }
  .mark { height: 9mm; width: auto; }
  .brand .name { font-family: ${heading}; font-weight: 900; font-size: 15pt; }
  .kind { direction: ltr; text-align: left; font-size: 7.5pt; letter-spacing: .16em; color: #645c50; }
  .kind .ver { font-weight: 700; color: #201e1d; }
  .rule { height: 1.6pt; background: #ea5b48; margin: 3mm 0 7mm; }

  h1 { font-family: ${heading}; font-weight: 900; font-size: 22pt; line-height: 1.15; margin: 0 0 2mm; }
  .lede { font-size: 10.5pt; color: #4a463f; margin: 0 0 7mm; max-width: 120mm; }

  /* The code is the document. Everything else is here to explain it. */
  .vault { display: flex; gap: 7mm; align-items: stretch; }
  .code-panel { flex: 1; border: 1.2pt solid #201e1d; border-radius: 3pt; padding: 5mm 6mm; }
  .code-label { font-size: 8pt; letter-spacing: .14em; color: #645c50; margin-bottom: 3mm; }
  /* Machine-readable text a human retypes: Latin, monospace, explicitly LTR so
     no bidi rule can reorder a group. */
  .code { direction: ltr; text-align: left; font-family: 'Courier New', monospace; font-size: 15pt; font-weight: 700; letter-spacing: .1em; }
  .code-line { margin-bottom: 2mm; white-space: nowrap; }
  .code-line:last-child { margin-bottom: 0; }

  .qr { margin: 0; flex: none; width: 32mm; text-align: center; }
  .qr img { width: 32mm; height: 32mm; display: block; }
  .qr figcaption { font-size: 7.5pt; color: #645c50; margin-top: 1.5mm; line-height: 1.35; }

  /* Label-over-value on hairlines — the same grammar as the app's own rows. */
  .fields { display: flex; flex-wrap: wrap; gap: 0; margin-top: 7mm; border-top: .7pt solid #dcd3c4; }
  .field { width: 50%; padding: 3mm 0; border-bottom: .7pt solid #dcd3c4; }
  .field .k { font-size: 8pt; letter-spacing: .06em; color: #645c50; }
  .field .v { font-size: 11pt; font-weight: 700; margin-top: .5mm; }
  .field .ltr { direction: ltr; text-align: right; unicode-bidi: isolate; }

  .how { margin-top: 7mm; }
  .how h2 { font-family: ${heading}; font-weight: 900; font-size: 12pt; margin: 0 0 2mm; }
  .how p { margin: 0 0 3mm; font-size: 10.5pt; color: #4a463f; }
  .how ol { margin: 0; padding-inline-start: 6mm; font-size: 10.5pt; }
  .how li { margin-bottom: 1.5mm; }

  /* The bearer-token warning. Bordered rather than filled so it reads on any
     printer, and the rule above it is thick enough to find at a glance. */
  .warning { margin-top: 7mm; border: 1.2pt solid #9d3e2e; border-radius: 3pt; padding: 4mm 5mm; color: #9d3e2e; font-size: 10.5pt; }
  .warning p { margin: 0 0 1.5mm; }
  .warning p:last-child { margin-bottom: 0; }
  .warning strong { font-weight: 700; }

  .foot { margin-top: 6mm; padding-top: 3mm; border-top: .7pt solid #dcd3c4; display: flex; justify-content: space-between; gap: 6mm; font-size: 8.5pt; color: #645c50; }
  .foot .ltr { direction: ltr; text-align: left; }
</style>
</head>
<body>
  <header class="masthead">
    <div class="brand">${logo}<span class="name">${escapeHtml(t.brandName)}</span></div>
    <div class="kind">
      ${escapeHtml(t.documentSubtitle)}<br />
      <span class="ver">WSY${data.paperVersion}</span>
    </div>
  </header>
  <div class="rule"></div>

  <h1>${escapeHtml(t.documentTitle)}</h1>
  <p class="lede">${escapeHtml(t.howWhen)}</p>

  <section class="vault">
    <div class="code-panel">
      <div class="code-label">${escapeHtml(t.codeLabel)}</div>
      <div class="code">${code}</div>
    </div>
    ${qr}
  </section>

  <section class="fields">
    ${field(t.owner, data.ownerName)}
    ${field(t.account, data.accountEmail, true)}
    ${field(t.issued, fmtDate(data.issuedAt, data.locale))}
    ${field(t.version, `WSY${data.paperVersion}`, true)}
  </section>

  <section class="how">
    <h2>${escapeHtml(t.howTitle)}</h2>
    <ol>${steps}</ol>
  </section>

  <section class="warning">
    <p><strong>${escapeHtml(t.handling)}</strong></p>
    <p>${escapeHtml(t.shownOnce)}</p>
  </section>

  <footer class="foot">
    <span>${escapeHtml(t.keepWithWill)}</span>
    <span class="ltr">${escapeHtml(t.sheetFooter)}</span>
  </footer>
</body>
</html>`
}

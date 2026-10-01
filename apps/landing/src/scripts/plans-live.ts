/**
 * Refreshes the Plans section from Convex on every visit, so a limit or a price
 * edited in the console shows without rebuilding the site.
 *
 * The build's numbers stay in the HTML — for search engines, for visitors
 * without JavaScript, and for when this fails, which it does silently. One
 * `fetch` to Convex's HTTP query API: no client library, no socket, and the
 * formatting is the build's own (`lib/plan-view.ts`), so a refreshed value can
 * never be written differently from a built one.
 *
 * Reaching Convex needs `https://*.convex.cloud` in the CSP's `connect-src`
 * (`nginx.conf`).
 */
import type { Locale } from "@/i18n/locale"
import { isReadable, priceFor, valuesFor, type PlanStrings } from "@/lib/plan-view"
import type { PublishedPlans } from "@/lib/plans"

type Live = { url: string; locale: Locale; strings: PlanStrings }

const section = document.getElementById("plans")
const raw = section?.dataset.live
if (section !== null && section !== undefined && raw !== undefined) {
  void refresh(section, JSON.parse(raw) as Live)
}

async function refresh(section: HTMLElement, live: Live): Promise<void> {
  try {
    const response = await fetch(`${live.url}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "plans:published", args: {}, format: "json" }),
    })
    if (!response.ok) return
    const body = (await response.json()) as { status?: string; value?: PublishedPlans }
    if (body.status !== "success" || body.value === undefined) return
    apply(section, body.value, live)
  } catch {
    // The build's numbers stay.
  }
}

function apply(section: HTMLElement, plans: PublishedPlans, live: Live): void {
  if (isReadable(plans)) {
    for (const plan of ["free", "annual"] as const) {
      const values = valuesFor(plans, plan, live.locale, live.strings)
      const byRow: Record<string, [string, boolean]> = {
        storage: [values.storage, true],
        assets: [values.assets, true],
        executors: [values.executors, true],
        photos: [values.photos, values.photosOn],
        fileSize: [values.fileSize, true],
      }
      for (const [key, [text, on]] of Object.entries(byRow)) {
        const row = section.querySelector<HTMLElement>(`[data-plan-row="${plan}.${key}"]`)
        const value = row?.querySelector<HTMLElement>("[data-plan-value]")
        if (row == null || value == null) continue
        value.textContent = text
        row.dataset.on = String(on)
      }
    }
  }

  const price = priceFor(plans, live.locale, live.strings)
  if (price !== null) {
    const display = section.querySelector<HTMLElement>('[data-plan-price="display"]')
    const note = section.querySelector<HTMLElement>('[data-plan-price="note"]')
    const month = section.querySelector<HTMLElement>('[data-plan-price="month"]')
    const varies = section.querySelector<HTMLElement>('[data-plan-price="varies"]')
    if (display !== null) display.textContent = price.display
    if (note !== null) note.textContent = price.note
    if (month !== null) {
      month.textContent = price.perMonth
      month.hidden = false
    }
    if (varies !== null) varies.hidden = false
  }
}

/**
 * GA4 behind consent, in Google's *basic* consent mode: until the visitor
 * accepts, `gtag.js` is not even requested — no cookieless pings, no tag
 * loaded in a denied state. The choice is kept in localStorage, which is not a
 * cookie; if storage is unavailable the banner simply asks again.
 *
 * This is the only script the site ships. GA belongs to this site alone —
 * never add it to `apps/web` or `apps/mobile`.
 */
export {}

type Choice = "granted" | "denied"

const STORAGE_KEY = "wassiya.consent"

declare global {
  interface Window {
    dataLayer: unknown[]
    [disable: `ga-disable-${string}`]: boolean
  }
}

const banner = document.getElementById("consent")
const gaId = banner?.dataset.gaId
let loaded = false

function readChoice(): Choice | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "granted" || value === "denied" ? value : null
  } catch {
    return null
  }
}

function writeChoice(choice: Choice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // Private mode or blocked storage: the banner will ask again next visit.
  }
}

function gtag(..._args: unknown[]): void {
  // gtag.js reads `arguments` objects off the data layer; an array is ignored.
  window.dataLayer.push(arguments)
}

function loadAnalytics(id: string): void {
  if (loaded) return
  loaded = true
  window[`ga-disable-${id}`] = false
  window.dataLayer = window.dataLayer ?? []
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  })
  gtag("js", new Date())
  gtag("config", id, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.append(script)
}

/** Withdrawn consent: stop sending and remove what GA already set. */
function unloadAnalytics(id: string): void {
  window[`ga-disable-${id}`] = true
  const host = location.hostname
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`]
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim()
    if (!name?.startsWith("_ga")) continue
    for (const domain of domains) {
      document.cookie = `${name}=; max-age=0; path=/${domain ? `; domain=${domain}` : ""}`
    }
  }
}

function show(): void {
  if (banner) banner.hidden = false
}

function hide(): void {
  if (banner) banner.hidden = true
}

if (banner && gaId) {
  const choice = readChoice()
  if (choice === "granted") loadAnalytics(gaId)
  if (choice === null) show()

  banner.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLElement>("[data-consent]")
    const next = button?.dataset.consent
    if (next !== "granted" && next !== "denied") return
    writeChoice(next)
    if (next === "granted") loadAnalytics(gaId)
    else if (loaded) unloadAnalytics(gaId)
    hide()
  })

  for (const opener of document.querySelectorAll("[data-consent-open]")) {
    opener.addEventListener("click", show)
  }

  document.addEventListener("click", (event) => {
    const target = (event.target as Element).closest<HTMLElement>("[data-track]")
    if (!target || !loaded || readChoice() !== "granted") return
    gtag("event", target.dataset.track, { label: target.dataset.trackLabel })
  })
}

---
name: astro-landing
description: >-
  Work in the Astro marketing site at apps/landing (wassiya.app). Use when
  editing the landing page, its copy or legal pages, adding sections/components,
  touching Tailwind v4 styling there, the consent/analytics script, or the
  build-time plan limits. Captures the zero-JS model, the Tailwind @source fix,
  the i18n routing, and the traps in the build-time Convex fetch.
---

# Landing (Astro)

`apps/landing` is the **static** public site at wassiya.app: an Arabic home at
`/`, English at `/en/`, and `/legal/{terms,privacy,encryption}` in both. It
reuses `@workspace/ui` tokens (the `.wassiya` Organic palette) and ships four
small scripts: the consent-gated analytics, `scripts/plans-live.ts` (refreshes
the Plans section from Convex on every visit), `scripts/app-demo.ts` (the
hero's interactive phone) and `scripts/signed-in.ts` (the header button's
label). Everything else is static HTML.

## When to use
- Any change under `apps/landing`: sections, copy, legal Markdown, styling, env.

## When NOT to use
- The Next.js apps or mobile — different runtimes.

## Layout of the code
- Copy lives in `src/i18n/strings/*.ts` as `{ ar, en }` (same thin catalogue as
  `apps/web`); home sections in `src/components/home/`; legal text in
  `src/content/legal/{ar,en}/*.md` (content collection, `src/content.config.ts`).
- **The legal slugs are linked from the mobile app** (`apps/mobile/screens/settings/legal`).
  Never rename one without changing that screen.
- `REVIEW-NOTES.md` beside the legal files is for the lawyer and is not published.
  `draft: true` in a legal file shows the "pending legal review" banner; only a
  sign-off removes it.
- The hero picture is an **interactive demo** in `PhoneFrame`:
  `src/components/mock/AppDemo.astro` (Home, Vault, Executors tabs and the
  check-in), driven by `scripts/app-demo.ts`. It is always drawn — a real
  screenshot cannot be interactive. **The check-in confirms only through the
  fingerprint prompt**, as in the app; never let a tap alone confirm. Without
  JavaScript it is the Home screen. The printed sheet is pictured once, in the
  keys section; don't put a second sheet on the page. The share images in
  `public/og/` show the hero too, so changing it means regenerating those.
  The product pictures are drawn fragments in
  `src/components/mock/`, built from the app's tokens and strings; when the
  app's look changes, they change with it. Sample names only.
- Icons are `lucide-react` rendered to static SVG (no `client:*`, so no JS).
  lucide v1 renamed some icons: `FingerprintPattern`, `House`.
- Brand surfaces shared with `apps/web` (`.text-brand`, `.bg-brand`, `.grain`,
  `.band`, `.dot-grid`, `.site-header`, and the `.font-heading` fix) live in
  `packages/ui/src/styles/surface.css`, driven by tokens in `globals.css`. The
  landing-only ones — loud motion (`.float-*`, `.pulse-ring`,
  `.cipher-flicker`) and the dark-section patterns (`.dot-grid-light`,
  `.khatam-light`) — stay in this app's `global.css` so the web app cannot use
  them. All motion is CSS and stops under reduced motion.

## Copy rules (from AGENTS.md)
- **Wassiya holds no key, and the price of that is stated, never hidden.** "Not
  even us" holds before and after death: the executor opens what was handed over
  with their own sheet, or the owner's recovery sheet. If every sheet is lost,
  nobody can open it — never write that Wassiya can open, recover or reset
  anything.
- **Delivery goes to the executor(s)**, who carry out the will — never "to the
  people you chose". Arabic: الوصي / الأوصياء, never وريث / ورثة for this role.
- **No price or plan limit typed as text** — both come only from the
  build-time fetch below. Prices are `planPrices` rows (edited in the console's
  Settings › Plans), formatted with `@workspace/ui/lib/price`. Until the site has
  a page per market, Arabic shows the `SA` row and English the default (`*`) row.
- **No "am I an executor?" path.** Every executor is silent.
- Links into the web app go through `webUrl(locale, path)`, which appends
  `?lang=` — `apps/web/proxy.ts` turns that into the web app's locale cookie.

## Build-time plan limits (the stale-data traps)
- `src/lib/plans.ts` reads `api.plans.published` with `ConvexHttpClient` **once
  per build** from `PUBLIC_CONVEX_URL`. Unset or unreachable → the Plans section
  renders words instead of numbers and no price, and the build logs a warning.
- **Then the browser refreshes them.** `scripts/plans-live.ts` posts to Convex's
  HTTP query API (`/api/query`, `plans:published`) on every visit and rewrites
  the `data-plan-*` elements, so a plan or price edited in the console shows
  without a rebuild. Build and browser format through the same
  `lib/plan-view.ts` — never format a plan value anywhere else. The HTML keeps
  the build's numbers for search engines and no-JS visitors, and a failed fetch
  leaves them. It needs `https://*.convex.cloud` in the CSP's `connect-src`.
- The build's numbers are still frozen into the HTML, which is what search
  engines index until the next rebuild. That is why `apps/landing/turbo.json` sets
  `build.cache: false` (turbo would otherwise replay an old `dist/`, since no file
  changed) and declares `PUBLIC_*` in `env` (strict env mode hides them otherwise).

## Env
All build-time, all public (inlined into HTML) — see `.env.example`:
`PUBLIC_WEB_URL`, `PUBLIC_APP_STORE_URL`, `PUBLIC_PLAY_STORE_URL`,
`PUBLIC_APP_STORE_ID`, `PUBLIC_CONVEX_URL`, `PUBLIC_GA_ID`. The Dockerfile takes
each as a `--build-arg`.

## Analytics and CSP
- GA4 runs only after consent (basic consent mode: `gtag.js` is not requested
  before "Accept"). Unset `PUBLIC_GA_ID` → no banner and no script at all. GA
  belongs to this site only — never add it to web or mobile.
- `nginx.conf` sends a CSP with no inline script. `vite.build.assetsInlineLimit: 0`
  in `astro.config.mjs` stops Astro inlining small scripts; keep it. A new third
  party means editing the CSP in `nginx.conf`.

## Tailwind v4 + shared tokens
- `src/styles/global.css` imports the shared theme and **adds an Astro content
  source** (`@source "./**/*.{astro,ts,tsx}"`). Without it, classes written in
  `.astro` markup are never generated.
- **CSS-comment trap:** a glob containing `**/` inside a CSS comment closes the
  comment early. Keep globs out of comments.
- Fonts are self-hosted with `@fontsource` (Cairo for headings, IBM Plex Sans
  Arabic for body in both languages). `global.css` defines `--font-cairo` /
  `--font-plex-arabic`, and overrides `.font-heading`, because the shared theme
  declares `--font-heading` inline as the body face.
- Buttons use `buttonClasses` from `@workspace/ui/lib/wassiya-button` (shared with
  `apps/web`), via `ButtonLink.astro` — not shadcn's `buttonVariants`.
- Light only, like the web app; never `prefers-color-scheme`.
- **The header frame and footer are shared with the web app**
  (`@workspace/ui/components/site/`), rendered in `layouts/Layout.astro` with
  links from `lib/site-hrefs.ts`. Change them there, never with a local copy.
  This site supplies its own menu and account button through the header's
  `nav` / `actions` slots; `scripts/signed-in.ts` swaps the button's label to
  "بلاغاتي" when Clerk's `__client_uat` marker shows a session.

## Verify
- `pnpm --filter landing build`; with `PUBLIC_GA_ID` unset, `dist/index.html`
  has no `<script>`. With `PUBLIC_CONVEX_URL` set, the Plans section shows numbers.
- `pnpm --filter landing typecheck` (`astro check`) passes.
- Visual check: `astro preview`, then headless Edge `--screenshot` with
  `--force-prefers-reduced-motion` (otherwise the `.rise` fade-ins are caught
  half-way). Edge
  will not go below ~500px wide; for a 390px check, load the page in a 390px
  iframe.

/**
 * Everything the build reads from its environment, resolved once.
 *
 * Every value is public — Astro inlines it into static HTML — and every one
 * degrades rather than failing the build: no store URL renders "coming soon",
 * no GA id ships no script, no Convex URL drops the plan numbers.
 */
function read(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed === undefined || trimmed === "" ? undefined : trimmed
}

export const SITE = {
  webUrl: (read(import.meta.env.PUBLIC_WEB_URL) ?? "http://localhost:3001").replace(/\/$/, ""),
  appStoreUrl: read(import.meta.env.PUBLIC_APP_STORE_URL),
  playStoreUrl: read(import.meta.env.PUBLIC_PLAY_STORE_URL),
  appStoreId: read(import.meta.env.PUBLIC_APP_STORE_ID),
  convexUrl: read(import.meta.env.PUBLIC_CONVEX_URL),
  gaId: read(import.meta.env.PUBLIC_GA_ID),
} as const

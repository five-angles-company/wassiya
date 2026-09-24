// @ts-check
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
  site: "https://wassiya.app",
  server: { port: 3000 },
  // Arabic is the unprefixed default and English the opt-in, the same rule as
  // `apps/web/lib/i18n/locale.ts`. There is deliberately no Accept-Language
  // redirect: the mobile app links to `/legal/*` and expects Arabic there.
  i18n: {
    locales: ["ar", "en"],
    defaultLocale: "ar",
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      i18n: { defaultLocale: "ar", locales: { ar: "ar", en: "en" } },
      filter: (page) => !page.endsWith("/404/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Astro inlines any script under this size, and `nginx.conf`'s CSP allows
    // no inline script. Zero keeps the consent script an external file.
    build: { assetsInlineLimit: 0 },
  },
})

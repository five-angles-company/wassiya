import type { ImageMetadata } from "astro"

import type { Locale } from "@/i18n/locale"

export type ScreenName = "home"

// Optional files: a missing capture must never fail the build, so they are
// discovered rather than imported. See `src/assets/screens/README.md`.
const FILES = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/screens/*/*.{png,jpg,jpeg,webp}",
  { eager: true }
)

function find(locale: Locale, name: ScreenName): ImageMetadata | undefined {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const file = FILES[`/src/assets/screens/${locale}/${name}.${ext}`]
    if (file) return file.default
  }
  return undefined
}

/** The capture in this language, else the other one, else nothing. */
export function screenFor(locale: Locale, name: ScreenName): ImageMetadata | undefined {
  return find(locale, name) ?? find(locale === "ar" ? "en" : "ar", name)
}

import { cookies } from "next/headers"

import { resolveTheme, THEME_COOKIE, type Theme } from "@/lib/theme"

/**
 * The reader's colour scheme, inside a Server Component.
 *
 * `cookies()` is memoised per request, so every layout that needs it can ask
 * directly rather than threading it down through props.
 */
export async function getTheme(): Promise<Theme> {
  return resolveTheme((await cookies()).get(THEME_COOKIE)?.value)
}

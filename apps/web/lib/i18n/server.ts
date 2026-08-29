import { cookies } from "next/headers"

import { LOCALE_COOKIE, resolveLocale, type Locale } from "@/lib/i18n/locale"

/**
 * The reader's locale, inside a Server Component.
 *
 * `cookies()` is memoised per request, so every server component that needs the
 * locale can ask for it directly rather than being handed it down through props
 * it does not otherwise want. Client components use `useLocale()` instead — the
 * root layout resolves this once and puts the answer in context.
 */
export async function getLocale(): Promise<Locale> {
  return resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value)
}

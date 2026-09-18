import { t, type Locale } from "@/lib/i18n/locale"
import { AUTH } from "@/lib/i18n/strings/auth"

/**
 * Our words, in the shape Clerk expects.
 *
 * ## ⚠️ The one place this app names another library's string keys
 *
 * Everything else here is `{ ar, en }` pairs read through `t`. Clerk's
 * localization is a nested object with its own names — `signIn.start.title`,
 * `formFieldLabel__emailAddress` — and those names belong to a package that can
 * rename them in a minor version. Confining the mapping to one file means an
 * upgrade breaks in one place instead of wherever a string happened to be
 * written.
 *
 * ⚠️ **A key Clerk no longer knows is ignored, not an error.** So this fails by
 * quietly reverting to English rather than by crashing — which is survivable,
 * and is exactly why the list is kept to strings a reader actually meets. A
 * hundred mapped keys would be a hundred ways to silently drift back into
 * English one upgrade at a time, with nobody looking.
 */
export function clerkLocalization(locale: Locale) {
  const labels = t(AUTH, locale)

  return {
    signIn: {
      start: {
        title: labels.signInTitle,
        subtitle: labels.signInSubtitle,
      },
    },
    signUp: {
      start: {
        title: labels.signUpTitle,
        subtitle: labels.signUpSubtitle,
      },
    },
    /*
     * ⚠️ **`formButtonPrimary` is every primary button Clerk draws**, not just
     * the first one — the verification step's submit is the same key. «متابعة»
     * is right for both, which is why it can be one string.
     */
    formButtonPrimary: labels.continueAction,
    formFieldLabel__emailAddress: labels.emailLabel,
    formFieldInputPlaceholder__emailAddress: labels.emailPlaceholder,
    dividerText: labels.divider,
    socialButtonsBlockButton: labels.socialButton,
  }
}

import { arSA } from "@clerk/localizations/ar-SA"

import { t, type Locale } from "@/lib/i18n/locale"
import { AUTH } from "@/lib/i18n/strings/auth"

/**
 * Our words, in the shape Clerk expects, over Clerk's own Arabic.
 *
 * `arSA` is the base so that every sub-step — the email code, "resend", each
 * error — reads in Arabic; an Arabic reader who meets English halfway through
 * signing in has been let down whatever the reason. Our strings go on top for
 * the screens a reader meets first, and for the few `arSA` strings on the
 * sign-in path that are misspelt.
 *
 * ⚠️ **A key Clerk no longer knows is ignored, not an error**, so an upgrade
 * that renames one fails by quietly showing `arSA`'s wording instead of ours.
 * `@clerk/localizations` is pinned to the release built against the installed
 * `@clerk/shared`; bump them together.
 */
export function clerkLocalization(locale: Locale) {
  const labels = t(AUTH, locale)
  const base = locale === "ar" ? arSA : undefined

  return {
    ...base,
    signIn: {
      ...base?.signIn,
      start: {
        ...base?.signIn?.start,
        title: labels.signInTitle,
        titleCombined: labels.signInTitle,
        subtitle: labels.signInSubtitle,
        subtitleCombined: labels.signInSubtitle,
      },
      password: { ...base?.signIn?.password, title: labels.passwordTitle },
    },
    signUp: {
      ...base?.signUp,
      start: {
        ...base?.signUp?.start,
        title: labels.signUpTitle,
        titleCombined: labels.signUpTitle,
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
    footerActionLink__useAnotherMethod: labels.useAnotherMethod,
    dividerText: labels.divider,
    socialButtonsBlockButton: labels.socialButton,
  }
}

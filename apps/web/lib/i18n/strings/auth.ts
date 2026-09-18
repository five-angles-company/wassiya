import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The doorway's words.
 *
 * ## ⚠️ Why these exist rather than `@clerk/localizations`
 *
 * Clerk ships an `arSA` bundle and it is a community contribution — a few
 * hundred strings of varying voice, almost none of which this product renders.
 * What it does render is the handful below, and those are the ones a bereaved
 * reader meets first. "Welcome back! Please sign in to continue" is a SaaS
 * greeting; it is the wrong sentence to show someone who arrived from an email
 * about a death.
 *
 * So these are written here, in the same shape and the same file layout as every
 * other string in the app, and passed to Clerk as a partial localization. A key
 * we do not list falls back to Clerk's English, which is the honest failure: a
 * sub-step nobody translated reads as untranslated rather than as blank.
 *
 * ⚠️ **Keep this list short on purpose.** It is a map of another library's
 * internals; every key added is one that can be renamed by an upgrade and fail
 * silently, so only the ones a reader actually sees earn a place.
 */
export const AUTH = {
  signInTitle: { ar: "الدخول إلى وصيّة", en: "Sign in to Wassiya" },

  /**
   * ⚠️ **Not a greeting.** Clerk's default is "Welcome back! Please sign in to
   * continue", and most people reaching this screen are following a link from an
   * email about somebody's death. This says what the next step is and nothing
   * more.
   */
  signInSubtitle: {
    ar: "أدخل بريدك للمتابعة.",
    en: "Enter your email to continue.",
  },

  signUpTitle: { ar: "إنشاء حساب في وصيّة", en: "Create a Wassiya account" },

  signUpSubtitle: {
    ar: "يلزم حساب لمتابعة بلاغك — ولا شيء غير ذلك.",
    en: "An account is needed to follow your report — nothing more.",
  },

  emailLabel: { ar: "البريد الإلكتروني", en: "Email address" },

  emailPlaceholder: { ar: "name@example.com", en: "name@example.com" },

  /** The one button. «متابعة» everywhere, matching the funnel's own verb. */
  continueAction: { ar: "متابعة", en: "Continue" },

  /** Between the provider button and the email field. */
  divider: { ar: "أو", en: "or" },

  /**
   * Clerk interpolates the provider name into this one, so the braces are part
   * of the string and must survive translation.
   */
  socialButton: {
    ar: "المتابعة عبر {{provider|titleize}}",
    en: "Continue with {{provider|titleize}}",
  },
} satisfies Dictionary

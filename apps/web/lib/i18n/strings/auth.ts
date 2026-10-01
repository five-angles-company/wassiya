import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The doorway's words, laid over Clerk's `arSA` bundle (`clerk-localization.ts`).
 *
 * "Welcome back! Please sign in to continue" is a SaaS greeting; it is the
 * wrong sentence to show someone who arrived from an email about a death. These
 * are the strings a bereaved reader meets first, in this product's voice.
 *
 * ⚠️ **Keep this list short on purpose.** It is a map of another library's
 * internals; every key added is one that can be renamed by an upgrade and fail
 * silently, so only the ones a reader actually sees earn a place.
 */
export const AUTH = {
  // The page around Clerk's form (`AuthShell`), ours rather than Clerk's.
  pageEyebrow: { ar: "حسابك", en: "Your account" },
  pageTitle: { ar: "تابِع بلاغك، واستلم ما سُلِّم إليك", en: "Follow your report, and receive what was handed over to you" },
  pageLead: {
    ar: "حساب مجاني ببريدك الإلكتروني: لمتابعة بلاغ وفاة قدّمته، أو لتفتح بصفتك وصيّاً ما سُلِّم إليك.",
    en: "A free account with your email: to follow a death report you filed, or to open what was handed over to you as an executor.",
  },
  // Owners never sign in here (their vault is mobile only), so the page says
  // where to go instead of letting them make a second, empty account.
  ownerNote: { ar: "صاحب خزنة؟ خزنتك في تطبيق وصيّة على جوّالك، لا هنا.", en: "Own a vault? It lives in the Wassiya app on your phone, not here." },
  ownerLink: { ar: "حمّل التطبيق", en: "Get the app" },

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

  // Read by someone filing a report and by an executor following our link.
  signUpSubtitle: {
    ar: "حساب مجاني لمتابعة بلاغك، أو لتفتح بصفتك وصيّاً ما سُلِّم إليك — ولا شيء غير ذلك.",
    en: "A free account to follow your report or, as an executor, open what was handed over to you — nothing more.",
  },

  emailLabel: { ar: "البريد الإلكتروني", en: "Email address" },

  emailPlaceholder: { ar: "name@example.com", en: "name@example.com" },

  /** The one button. «متابعة» everywhere, matching the funnel's own verb. */
  continueAction: { ar: "متابعة", en: "Continue" },

  /** Between the provider button and the email field. */
  divider: { ar: "أو", en: "or" },

  // Two of `arSA`'s strings on the sign-in path are misspelt; these replace them.
  passwordTitle: { ar: "أدخل كلمة المرور", en: "Enter your password" },
  useAnotherMethod: { ar: "اختر طريقة أخرى", en: "Use another method" },

  /**
   * Clerk interpolates the provider name into this one, so the braces are part
   * of the string and must survive translation.
   */
  socialButton: {
    ar: "المتابعة عبر {{provider|titleize}}",
    en: "Continue with {{provider|titleize}}",
  },
} satisfies Dictionary

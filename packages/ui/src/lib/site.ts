/**
 * What wassiya.app and the web app share in their header and footer: the
 * words, and the set of links each app fills in. One copy, so the two sites can
 * never name the same place differently.
 */
export type SiteLocale = "ar" | "en"

/** Every destination the shared chrome links to. Each app builds this for its own URLs. */
export type SiteHrefs = {
  home: string
  how: string
  security: string
  plans: string
  faq: string
  help: string
  reportDeath: string
  terms: string
  privacy: string
  encryption: string
  /** Switches to the other language and back to the same page. */
  language: string
}

const COPY = {
  appName: { ar: "وصيّة", en: "Wassiya" },
  mainNav: { ar: "التنقّل الرئيسي", en: "Main navigation" },
  // The web app's signed-in front page: a person's reports and deliveries.
  myReports: { ar: "بلاغاتي", en: "My reports" },
  navHow: { ar: "كيف تعمل", en: "How it works" },
  navSecurity: { ar: "الخصوصية", en: "Privacy" },
  navPlans: { ar: "الخطط", en: "Plans" },
  navFaq: { ar: "أسئلة", en: "Questions" },
  help: { ar: "المساعدة", en: "Help" },
  reportDeath: { ar: "أبلغ عن وفاة", en: "Report a death" },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  // Named in the language it switches to, so a reader can always find it.
  switchLanguage: { ar: "English", en: "العربية" },
  footerPromise: {
    ar: "ما دمت حيّاً، لا أحد يفتح خزنتك — ولا نحن.",
    en: "While you live, nobody opens your vault — not even us.",
  },
  footerProduct: { ar: "المنتج", en: "Product" },
  footerFamilies: { ar: "للعائلات", en: "For families" },
  footerLegal: { ar: "قانوني", en: "Legal" },
  terms: { ar: "شروط الاستخدام", en: "Terms of use" },
  privacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  encryption: { ar: "كيف يعمل التشفير", en: "How the encryption works" },
  // The same sentence as mobile's `LEGAL.notLegal`: the product's most
  // important legal statement, repeated wherever a reader already is.
  notLegal: {
    ar: "وصيّة ليست جهة قانونية ولا تقسّم التركات. الأنصبة يحدّدها القانون وفق الفرائض.",
    en: "Wassiya is not a legal authority and does not divide estates. Shares are set by law under the fara'id.",
  },
  cookieSettings: { ar: "إعدادات التتبّع", en: "Cookie settings" },
  copyright: { ar: "© {year} وصيّة", en: "© {year} Wassiya" },
} as const

/** A header menu link, for each app's own `nav`. */
export const SITE_NAV_LINK =
  "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] rounded-full px-4 py-2 text-[15px] font-semibold transition-colors"

export type SiteCopy = { [K in keyof typeof COPY]: string }

export function siteCopy(locale: SiteLocale): SiteCopy {
  return Object.fromEntries(Object.entries(COPY).map(([key, value]) => [key, value[locale]])) as SiteCopy
}

import type { Dictionary } from "@/i18n/locale"

// The header and footer's words live in `@workspace/ui/lib/site`, shared with
// the web app.
export const COMMON = {
  appName: { ar: "وصيّة", en: "Wassiya" },
  skipToContent: { ar: "تخطَّ إلى المحتوى", en: "Skip to content" },

  appStoreAlt: { ar: "حمّل من App Store", en: "Download on the App Store" },
  playStoreAlt: { ar: "احصل عليه من Google Play", en: "Get it on Google Play" },

  terms: { ar: "شروط الاستخدام", en: "Terms of use" },
  privacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  encryption: { ar: "كيف يعمل التشفير", en: "How the encryption works" },
} as const satisfies Dictionary

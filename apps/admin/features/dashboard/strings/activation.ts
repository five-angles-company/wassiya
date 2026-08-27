import type { Dictionary } from "@/lib/i18n/locale"

/** The funnel, the sign-up trend, and the identity gate that governs both. */
export const ACTIVATION = {
  funnelTitle: { ar: "مسار التفعيل", en: "Activation funnel" },
  funnelHint: {
    ar: "التحقق من الهوية بوّابة مانعة: لا خزنة قبله. لذلك يُتوقّع أن يكون أكبر تسرّب.",
    en: "Identity verification is a blocking gate — no vault before it — so it is where the biggest drop is expected.",
  },

  stageSignedUp: { ar: "سجّل", en: "Signed up" },
  stageIdentityVerified: { ar: "وُثّقت هويته", en: "Identity verified" },
  stageVaultCreated: { ar: "أنشأ الخزنة", en: "Vault created" },
  stageSheetPrinted: { ar: "طبع ورقة الاسترجاع", en: "Sheet printed" },
  stageHeirNamed: { ar: "سمّى وريثاً", en: "Heir named" },
  stageGuardianLive: { ar: "وصي فعّال", en: "Guardian live" },
  stageCheckinConfigured: { ar: "فعّل نبض الحياة", en: "Check-in configured" },

  // Stated on the page rather than quietly omitted: the app's own setup meter
  // has a step this console structurally cannot see.
  biometricsNote: {
    ar: "خطوة البصمة لا تظهر هنا: هي محفوظة في مخزن مفاتيح الجهاز ولا يوجد لها عمود على الخادم.",
    en: "The biometrics step is absent here: it lives only in the device keystore and has no server column.",
  },

  signupsTitle: { ar: "التسجيلات", en: "Sign-ups" },
  signupsHint: {
    ar: "آخر تسعين يوماً، محسوبة بتوقيت UTC.",
    en: "The last ninety days, bucketed in UTC.",
  },
  signupsEmpty: {
    ar: "لا تسجيلات في هذه المدة",
    en: "No sign-ups in this window",
  },
  signupsAxis: { ar: "تسجيل", en: "sign-ups" },

  identityTitle: { ar: "حالات الهوية", en: "Identity states" },
  identityHint: {
    ar: "«مرفوضة» و«استنفد المحاولات» ليسا الشيء نفسه: الجلسة المنتهية تُسجَّل مرفوضة دون أن تستهلك محاولة.",
    en: "Rejected and retries-exhausted are not the same: an expired session lands as rejected without spending an attempt.",
  },
  exhaustedLine: {
    ar: "منهم {n} استنفدوا محاولاتهم الـ{max} ولا يستطيعون إعادة المحاولة.",
    en: "{n} of those have spent all {max} attempts and cannot retry.",
  },
  identityUnverified: { ar: "لم يبدأ", en: "Unverified" },
  identityPending: { ar: "قيد التحقق", en: "Pending" },
  identityVerified: { ar: "موثّقة", en: "Verified" },
  identityRejected: { ar: "مرفوضة", en: "Rejected" },
} as const satisfies Dictionary

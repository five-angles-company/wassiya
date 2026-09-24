import type { Dictionary } from "@/lib/i18n/locale"

/** ٱلاشتراكات — accounts, read through the billing lens. */
export const SUBSCRIPTIONS = {
  pageTitle: { ar: "الاشتراكات", en: "Subscriptions" },

  // Says what the screen is. A subscription is a *field on an account*, not a
  // table, so this is the owners list with different columns rather than a
  // separate record — and an operator should know that the same rows appear
  // under Accounts rather than wondering which is authoritative.
  intro: {
    ar: "الاشتراك حقل على الحساب، لا سجلّ مستقل — هذه هي قائمة الحسابات نفسها من زاوية الفوترة.",
    en: "A subscription is a field on an account, not a record of its own. This is the same accounts list, read through the billing lens.",
  },

  colOwner: { ar: "المالك", en: "Owner" },
  colPlan: { ar: "الخطة", en: "Plan" },
  colStorage: { ar: "التخزين", en: "Storage" },
  colRenews: { ar: "التجديد", en: "Renews" },
  colJoined: { ar: "تاريخ التسجيل", en: "Joined" },
  colActions: { ar: "إجراءات", en: "Actions" },

  planFree: { ar: "مجانية", en: "Free" },
  planAnnual: { ar: "سنوية", en: "Annual" },
  lapsed: { ar: "منتهية", en: "Lapsed" },

  none: { ar: "—", en: "—" },
  empty: { ar: "لا حسابات", en: "No accounts" },
  emptyHint: {
    ar: "لا توجد حسابات مطابقة لهذه التصفية.",
    en: "No accounts match this filter.",
  },
  openMenu: { ar: "افتح القائمة", en: "Open menu" },
  actionOpenOwner: { ar: "افتح الحساب", en: "Open the account" },

  // The grant. Every one of these says what it does to *this* account, because
  // the row and the dialog are the only context an operator has.
  grant: { ar: "امنح سنة", en: "Grant a year" },
  extend: { ar: "مدّد سنة", en: "Extend a year" },
  expire: { ar: "أنهِ الآن", en: "Expire now" },
  revoke: { ar: "أعده للمجانية", en: "Back to free" },
  cancel: { ar: "إلغاء", en: "Cancel" },

  grantTitle: { ar: "منح الخطة السنوية", en: "Grant the annual plan" },
  grantBody: {
    ar: "تُمنح {name} الخطة السنوية لمدة سنة من اليوم. تُسجَّل العملية في سجل التدقيق باسمك.",
    en: "{name} gets the annual plan for one year from today. The grant is written to the audit log under your name.",
  },
  extendTitle: { ar: "تمديد الاشتراك", en: "Extend the subscription" },
  extendBody: {
    ar: "تُضاف سنة إلى تاريخ تجديد {name} الحالي، لا من اليوم — فلا يضيع ما تبقّى.",
    en: "A year is added to {name}'s existing renewal date, not to today, so nothing already paid for is lost.",
  },

  // Expiry is the only way to reach the lapsed state without waiting a year,
  // and the lapsed state has behaviour of its own that has to be testable.
  expireTitle: { ar: "إنهاء الاشتراك الآن", en: "Expire this subscription now" },
  expireBody: {
    ar: "يصبح تاريخ تجديد {name} في الماضي: تتوقّف إضافة الأصول، وتبقى الخزنة مقروءة وتسليم الورثة يعمل كما هو.",
    en: "{name}'s renewal date moves into the past: adding assets stops, while the vault stays readable and heir delivery keeps working.",
  },
  revokeTitle: { ar: "العودة إلى الخطة المجانية", en: "Back to the free plan" },
  revokeBody: {
    ar: "تُزال الخطة السنوية عن {name} بلا تاريخ انتهاء. هذا إلغاء، لا انتهاء اشتراك.",
    en: "The annual plan is removed from {name} with no end date. This is a revocation, not a lapse.",
  },

  toastGranted: { ar: "مُنحت الخطة", en: "Plan granted" },
  toastFailed: { ar: "تعذّر تغيير الخطة", en: "Could not change the plan" },

  // The catalogue editor. Every limit here is enforced by the server the moment
  // it is saved, for everyone on the plan — which is the sentence the sheet
  // has to say out loud, because nothing else on screen would.
  editLimits: { ar: "حدود الخطط", en: "Plan limits" },
  editLimitsTitle: { ar: "تعديل حدود الخطط", en: "Edit plan limits" },
  editLimitsBody: {
    ar: "تسري الحدود فوراً على كل من في الخطة. من تجاوز حداً خُفّض يحتفظ بكل ما لديه ولا يستطيع الإضافة فقط — لا يُحذف شيء.",
    en: "Limits apply immediately to everyone on the plan. Anyone already past a lowered limit keeps everything they have and simply cannot add more — nothing is deleted.",
  },
  // Prices are the one thing this sheet cannot touch, and an operator looking
  // for them should be told where they are rather than left hunting.
  noPricesHere: {
    ar: "الأسعار ليست هنا: تُضبط في App Store Connect وGoogle Play، ويعرض التطبيق سعر المتجر نفسه.",
    en: "Prices are not here: they are set in App Store Connect and Google Play, and the app renders the store's own price.",
  },
  // wassiya.app is static and prints these limits when it is built, so a save
  // here reaches the app at once and the public site only at its next build.
  landingRebuild: {
    ar: "موقع wassiya.app يطبع هذه الحدود عند بنائه. بعد الحفظ، أعد بناء الموقع ليعرضها.",
    en: "wassiya.app prints these limits when it is built. After saving, rebuild the site for it to show them.",
  },

  overrideTitle: { ar: "حدود خاصة بهذا الحساب", en: "Limits for this account" },
  overrideBody: {
    ar: "اترك الحقل فارغاً ليأخذ قيمة الخطة. ما تكتبه هنا يعلو على الخطة لهذا الحساب وحده.",
    en: "Leave a field empty to take the plan's value. Anything set here overrides the plan for this account alone.",
  },
  override: { ar: "حدود خاصة", en: "Custom limits" },
  overrideActive: { ar: "حدود خاصة", en: "Custom" },
  clearOverride: { ar: "أزل الحدود الخاصة", en: "Remove custom limits" },

  fieldStorage: { ar: "المساحة", en: "Storage" },
  fieldAssets: { ar: "عدد الأصول", en: "Assets" },
  fieldHeirs: { ar: "عدد الورثة", en: "Heirs" },
  fieldPhotos: { ar: "يسمح بالصور", en: "Photos allowed" },
  fieldMaxFile: { ar: "أكبر ملف", en: "Largest file" },
  unlimited: { ar: "بلا حد", en: "Unlimited" },
  inherit: { ar: "من الخطة", en: "From the plan" },
  megabytes: { ar: "م.ب", en: "MB" },

  save: { ar: "احفظ", en: "Save" },
  saving: { ar: "يُحفظ…", en: "Saving…" },
  toastLimits: { ar: "حُفظت الحدود", en: "Limits saved" },
  toastOverride: { ar: "حُفظت الحدود الخاصة", en: "Custom limits saved" },
  toastOverrideCleared: { ar: "أُزيلت الحدود الخاصة", en: "Custom limits removed" },
} as const satisfies Dictionary

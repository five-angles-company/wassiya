import type { Dictionary } from "@/lib/i18n/locale"

/** ٱلحسابات — the owner record, and everything that hangs off it. */
export const OWNERS = {
  pageTitle: { ar: "الحسابات", en: "Accounts" },
  back: { ar: "رجوع إلى الحسابات", en: "Back to accounts" },

  colOwner: { ar: "المالك", en: "Owner" },
  colIdentity: { ar: "الهوية", en: "Identity" },
  colPlan: { ar: "الاشتراك", en: "Plan" },
  colCountry: { ar: "الدولة", en: "Country" },
  colStorage: { ar: "التخزين", en: "Storage" },
  colJoined: { ar: "تاريخ التسجيل", en: "Joined" },
  colActions: { ar: "إجراءات", en: "Actions" },

  searchPlaceholder: { ar: "ابحث بالاسم أو البريد…", en: "Search name or email…" },
  filterPlan: { ar: "الاشتراك", en: "Plan" },
  planFree: { ar: "مجاني", en: "Free" },
  planPaid: { ar: "مدفوع", en: "Paid" },
  planNone: { ar: "بلا اشتراك", en: "No plan" },

  nameNone: { ar: "بلا اسم", en: "No name" },
  none: { ar: "—", en: "—" },

  empty: { ar: "لا حسابات", en: "No accounts" },
  emptyHint: {
    ar: "لا توجد حسابات مطابقة لهذه التصفية.",
    en: "No accounts match this filter.",
  },

  openMenu: { ar: "افتح القائمة", en: "Open menu" },
  actionOpen: { ar: "افتح الحساب", en: "Open account" },
  actionCopyEmail: { ar: "انسخ البريد", en: "Copy email" },

  // -- The detail screen ----------------------------------------------------
  detailNotFound: { ar: "لا يوجد حساب بهذا المعرّف", en: "No account with that id" },

  sectionIdentity: { ar: "الهوية", en: "Identity" },
  sectionVault: { ar: "الخزنة", en: "Vault" },
  sectionCheckin: { ar: "التحقق من الحياة", en: "Life check-in" },
  sectionHeirs: { ar: "الورثة", en: "Heirs" },
  sectionDelivery: { ar: "التسليم للورثة", en: "Delivery to heirs" },
  sectionDevices: { ar: "الأجهزة", en: "Devices" },
  sectionClaims: { ar: "الطلبات", en: "Claims" },

  verifiedName: { ar: "الاسم الموثّق", en: "Verified name" },
  docType: { ar: "المستند", en: "Document" },
  verifiedAt: { ar: "تاريخ التوثيق", en: "Verified" },
  attempts: { ar: "المحاولات", en: "Attempts" },

  // The vault is reported as dates and a version. Said plainly, because an
  // operator looking at this card should know what it is *not* showing them.
  vaultNone: { ar: "لم تُنشأ خزنة بعد", en: "No vault yet" },
  vaultNote: {
    ar: "لا يعرض هذا شيئاً من محتوى الخزنة — لا الخادم ولا هذه اللوحة يستطيعان قراءته.",
    en: "This shows nothing of the vault's contents. Neither the server nor this console can read them.",
  },
  paperVersion: { ar: "إصدار الوثيقة", en: "Sheet version" },
  paperPrinted: { ar: "طُبعت", en: "Printed" },
  paperUsed: { ar: "استُخدمت", en: "Used" },
  paperNotPrinted: { ar: "لم تُطبع", en: "Not printed" },
  wrapperLegacy: { ar: "غلاف قديم — يحتاج إعادة إصدار", en: "Old wrapper — needs reissuing" },
  rotatedAt: { ar: "آخر تدوير", en: "Last rotated" },

  checkinNone: { ar: "غير مفعّل", en: "Not set up" },
  cadence: { ar: "كل {n} شهر", en: "Every {n} months" },
  nextDue: { ar: "التالي", en: "Next due" },

  heirsNone: { ar: "لم يُضف ورثة", en: "No heirs" },
  deliveryNone: {
    ar: "لا ورثة — لا شيء يُسلَّم عند الوفاة.",
    en: "No heirs — nothing is delivered at death.",
  },
  bundleNever: { ar: "لم تُبنَ حزمته", en: "Never built" },
  bundleStale: { ar: "حزمته قديمة", en: "Out of date" },
  bundleBuilt: { ar: "بُنيت {date}", en: "Built {date}" },
  noIdNumber: { ar: "بلا رقم هوية", en: "No ID number" },
  devicesNone: { ar: "لا أجهزة", en: "No devices" },
  claimsNone: { ar: "لا طلبات", en: "No claims" },
  deviceRevoked: { ar: "مُلغى", en: "Revoked" },
  lastUnlock: { ar: "آخر فتح", en: "Last unlock" },
  never: { ar: "لم يُفتح", en: "Never" },
} as const satisfies Dictionary

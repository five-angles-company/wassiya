import type { Dictionary } from "@/lib/i18n/locale"

/**
 * One handed-over item, as its row names it: the type, the secret fields, the
 * values the owner picked from a list, and the file downloads.
 *
 * The field and value keys are the ones the owner's app writes into the sealed
 * secret. A key missing here shows as itself rather than disappearing.
 */
export const ASSET_LABELS = {
  noKeyTitle: { ar: "عنصر لم يُفتح", en: "An item that didn't open" },
  noKeyBody: {
    ar: "سُلِّم إليك، لكنه لم يُفتح على هذا الجهاز، ولا نستطيع نحن فتحه أيضاً. إن راسلتنا بشأنه، اذكر المرجع المكتوب تحته.",
    en: "It was handed over, but it didn't open on this device — and we can't open it either. If you write to us about it, mention the reference shown below it.",
  },

  download: { ar: "نزّل", en: "Download" },
  downloading: { ar: "جارٍ التنزيل…", en: "Downloading…" },
  downloadFailed: { ar: "لم يكتمل التنزيل. حاول مرة أخرى.", en: "The download didn't finish. Please try again." },
  downloadNumbered: { ar: "نزّل {n}", en: "Download {n}" },

  typeCrypto: { ar: "عملات رقمية", en: "Crypto" },
  typeBank: { ar: "حساب بنكي", en: "Bank account" },
  typeDocument: { ar: "مستند", en: "Document" },
  typePhotos: { ar: "صور", en: "Photos" },
  typeDigital: { ar: "حساب إلكتروني", en: "Online account" },
  typeNote: { ar: "ملاحظة", en: "Note" },

  fieldPhrase: { ar: "العبارة السرّية", en: "Recovery phrase" },
  fieldNetwork: { ar: "الشبكة", en: "Network" },
  fieldKind: { ar: "النوع", en: "Type" },
  fieldDevicePassword: { ar: "رمز الجهاز", en: "Device PIN" },
  fieldDeviceLocation: { ar: "مكان الجهاز", en: "Where the device is" },
  fieldAccount: { ar: "الحساب", en: "Account" },
  fieldPassword: { ar: "كلمة المرور", en: "Password" },
  fieldTwoFactor: { ar: "التحقق بخطوتين", en: "Two-step verification" },
  fieldBank: { ar: "البنك", en: "Bank" },
  fieldIban: { ar: "الآيبان", en: "IBAN" },
  fieldCountry: { ar: "الدولة", en: "Country" },
  fieldAccountType: { ar: "نوع الحساب", en: "Account type" },
  fieldCurrency: { ar: "العملة", en: "Currency" },
  fieldBranch: { ar: "الفرع", en: "Branch" },
  fieldInstructions: { ar: "تعليمات", en: "Instructions" },
  fieldService: { ar: "الخدمة", en: "Service" },
  fieldUsername: { ar: "اسم المستخدم", en: "Username" },
  fieldRecoveryCodes: { ar: "رموز الاسترداد", en: "Recovery codes" },
  fieldDisposition: { ar: "المطلوب", en: "What to do" },
  fieldBody: { ar: "النص", en: "Text" },

  valueHardware: { ar: "جهاز", en: "Hardware" },
  valueSoftware: { ar: "برنامج", en: "Software" },
  valueExchange: { ar: "منصة", en: "Exchange" },
  valueCurrent: { ar: "جارٍ", en: "Current" },
  valueSavings: { ar: "توفير", en: "Savings" },
  valueDeed: { ar: "صك ملكية", en: "Title deed" },
  valueMarriage: { ar: "عقد زواج", en: "Marriage contract" },
  valueCertificate: { ar: "شهادة", en: "Certificate" },
  valueOther: { ar: "أخرى", en: "Other" },
  valueInstructions: { ar: "تعليمات", en: "Instructions" },
  valueWhereabouts: { ar: "مكان أشياء", en: "Where things are" },
  valueWish: { ar: "وصية شخصية", en: "Personal wish" },
  valueHandOver: { ar: "يُسلَّم كما تنصّ الوصية", en: "Hand it over as the will says" },
  valueDelete: { ar: "احذفه نهائياً", en: "Delete it permanently" },
  valueMemorialise: { ar: "حوّله إلى حساب تذكاري", en: "Turn it into a memorial account" },
} as const satisfies Dictionary

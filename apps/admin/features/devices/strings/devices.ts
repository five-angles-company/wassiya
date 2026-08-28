import type { Dictionary } from "@/lib/i18n/locale"

/** ٱلأجهزة, across every account. */
export const DEVICES = {
  pageTitle: { ar: "الأجهزة", en: "Devices" },

  colDevice: { ar: "الجهاز", en: "Device" },
  colOwner: { ar: "المالك", en: "Owner" },
  colPlatform: { ar: "النظام", en: "Platform" },
  colLastUnlock: { ar: "آخر فتح", en: "Last unlock" },
  colRegistered: { ar: "سُجّل", en: "Registered" },
  colActions: { ar: "إجراءات", en: "Actions" },

  filterPlatform: { ar: "النظام", en: "Platform" },
  filterState: { ar: "الحالة", en: "State" },
  stateLive: { ar: "مفعّل", en: "Active" },
  stateRevoked: { ar: "مُلغى", en: "Revoked" },
  never: { ar: "لم يُفتح", en: "Never" },

  empty: { ar: "لا أجهزة", en: "No devices" },
  emptyHint: {
    ar: "لا توجد أجهزة مطابقة لهذه التصفية.",
    en: "No devices match this filter.",
  },

  openMenu: { ar: "افتح القائمة", en: "Open menu" },
  actionOpenOwner: { ar: "افتح حساب المالك", en: "Open the owner's account" },
} as const satisfies Dictionary

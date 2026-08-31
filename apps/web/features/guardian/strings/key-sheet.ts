import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The printed sheet's own words.
 *
 * Its own dictionary because the sheet is now rendered from two screens — the
 * accept ceremony and the key page — and a label that lived in either feature's
 * strings would have to be duplicated into the other. The two copies would then
 * be free to disagree about the layout of a code somebody transcribes by hand.
 */
export const KEY_SHEET = {
  title: { ar: "وثيقة مفتاح الوصي", en: "Guardian key sheet" },
  note: {
    ar: "١٤ مجموعة من ٤ · احفظها مع أوراقك المهمة، لا في هاتفك وحده.",
    en: "14 groups of 4 · keep it with your important papers, not only on your phone.",
  },
  print: { ar: "اطبعها", en: "Print it" },
  copy: { ar: "انسخ المفتاح", en: "Copy the key" },
} as const satisfies Dictionary

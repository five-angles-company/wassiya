import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The shell's labels — all four of them.
 *
 * This was the nav bar's dictionary: a group heading and a label for every
 * destination, indexed by `config/nav.ts` so that adding a link without adding
 * both languages failed the build. There are no destinations left. `/` routes a
 * reader into the one thing they have in flight, and the bar is a mark and an
 * avatar — so what survives is the product's name, the skip link, and the two
 * rows inside the avatar's menu.
 */
export const NAV = {
  appName: { ar: "وصيّة", en: "Wassiya" },
  skipToContent: { ar: "تخطَّ إلى المحتوى", en: "Skip to content" },
  account: { ar: "الحساب", en: "Account" },

  /**
   * ⚠️ **"مفتاح الوصاية", not "المفتاح".** The menu is shared with heirs, who
   * hold no key and would read a bare "key" as something of theirs that has gone
   * missing. Naming the role makes the row self-explanatory to the reader it is
   * not for.
   */

  // "Manage account" and "Account" sat next to each other in the old menu and
  // read as the same thing. This one is Clerk's modal — email, password, the
  // second factor — so it is named for what it actually holds.
  security: { ar: "الدخول والأمان", en: "Sign-in & security" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  openMenu: { ar: "حسابك", en: "Your account" },
} as const satisfies Dictionary

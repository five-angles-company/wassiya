import {
  BellIcon,
  FilePlus2Icon,
  FileTextIcon,
  HomeIcon,
  KeyRoundIcon,
  PackageIcon,
  ShieldCheckIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react"

import type { NAV } from "@/lib/i18n/strings/nav"

type NavKey = keyof typeof NAV

export type NavItem = {
  /** Key into the `NAV` dictionary — the label is never hardcoded here. */
  key: NavKey
  icon: LucideIcon
  href: string
  /**
   * Kept out of the desktop bar.
   *
   * A rail can hold eight links without cost; a bar cannot. Two items earn
   * their place elsewhere instead: "بلاغ جديد" is an action, and lives as a
   * button on the reports list where someone is already looking for it; the
   * account and the notifications sit in the bar's own controls cluster, as an
   * avatar and a bell, which is where every reader has been trained to find
   * them. All of them are still in the mobile menu, in full.
   */
  secondary?: boolean
}

export type NavGroup = {
  key: NavKey
  items: readonly NavItem[]
  /**
   * Which people see this group.
   *
   * `heir` and `guardian` appear only for someone who is one. A person can be
   * both, either, or — on the day they arrive — neither, and all four are
   * ordinary: an heir who has never guarded a vault should not be shown an
   * empty guardian section, and a guardian who has never lost anyone should not
   * be shown a reports list they will never file into.
   */
  audience: "heir" | "guardian" | "everyone"
}

/**
 * The app's information architecture.
 *
 * Two people share one bar. The groups are named for what they mean to the
 * person reading — "ما تركوه لك" and "وصايتك" — rather than for the tables
 * behind them, because neither of these readers is an operator and neither
 * arrived wanting to learn a data model.
 *
 * The grouping survives the move from a rail to a bar even though the bar
 * itself renders one flat row: the mobile menu still shows the labels, and
 * `audience` is what decides whether a section exists at all.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    key: "groupOverview",
    audience: "everyone",
    items: [{ key: "home", icon: HomeIcon, href: "/" }],
  },
  {
    key: "groupHeir",
    audience: "heir",
    items: [
      { key: "claims", icon: FileTextIcon, href: "/claims" },
      { key: "box", icon: PackageIcon, href: "/box" },
      { key: "newClaim", icon: FilePlus2Icon, href: "/claims/new", secondary: true },
    ],
  },
  {
    key: "groupGuardian",
    audience: "guardian",
    items: [
      { key: "guardian", icon: ShieldCheckIcon, href: "/guardian" },
      { key: "guardianKey", icon: KeyRoundIcon, href: "/guardian/key" },
    ],
  },
  {
    key: "groupAccount",
    audience: "everyone",
    items: [
      {
        key: "notifications",
        icon: BellIcon,
        href: "/notifications",
        secondary: true,
      },
      { key: "account", icon: UserIcon, href: "/account", secondary: true },
    ],
  },
]

/**
 * Does this nav item own the current path?
 *
 * `/` is matched exactly. A prefix test would make home the active item on
 * every screen in the app, which is not a cosmetic bug: the bar would stop
 * telling the reader where they are.
 *
 * `/claims/new` and `/claims` are siblings under the prefix rule, so a nested
 * item that matches more specifically wins and its ancestor yields. Without
 * that, filing a report would light up two links at once.
 */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  if (pathname === href) return true
  if (!pathname.startsWith(`${href}/`)) return false
  return !NAV_GROUPS.some((group) =>
    group.items.some(
      (other) =>
        other.href !== href &&
        other.href.startsWith(`${href}/`) &&
        (pathname === other.href || pathname.startsWith(`${other.href}/`))
    )
  )
}

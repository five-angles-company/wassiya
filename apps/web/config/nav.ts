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
  /** Renders the unread count beside the label. Exactly one item wants this. */
  badge?: "unread"
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
 * Two people share one shell. The groups are named for what they mean to the
 * person reading — "ما تركوه لك" and "وصايتك" — rather than for the tables
 * behind them, because neither of these readers is an operator and neither
 * arrived wanting to learn a data model.
 *
 * `newClaim` is a nav item and not only a button on the list, because the one
 * person who most needs it has an empty reports list and no idea this app has a
 * filing flow at all.
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
      { key: "newClaim", icon: FilePlus2Icon, href: "/claims/new" },
      { key: "box", icon: PackageIcon, href: "/box" },
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
      { key: "notifications", icon: BellIcon, href: "/notifications", badge: "unread" },
      { key: "account", icon: UserIcon, href: "/account" },
    ],
  },
]

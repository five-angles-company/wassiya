import {
  BellIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  FileClockIcon,
  GavelIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  MailIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TimerIcon,
  UnlockIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import type { NAV } from "@/lib/i18n/strings/nav"

type NavKey = keyof typeof NAV

export type NavItem = {
  /** Key into the `NAV` dictionary — the label is never hardcoded here. */
  key: NavKey
  icon: LucideIcon
  /**
   * `null` marks a section that exists in the product but has no screen yet.
   * It renders with its icon and label, disabled, carrying a "soon" badge —
   * deliberately not a working link to an empty page, which would read as a
   * finished feature that happens to have no data.
   */
  href: string | null
}

export type NavGroup = { key: NavKey; items: readonly NavItem[] }

/**
 * The console's information architecture.
 *
 * Grouped along the backend's own seams rather than a generic template.
 * **Review** is the human-judgement path a death claim walks; **Accounts** is
 * the owner's record; **Operations** is what runs unattended (the two hourly
 * crons, escalation mail, release); **Records** is the append-only material.
 *
 * Exactly one item resolves today. That is the honest state of the console: the
 * dashboard reads real data, and everything else is a named place to put the
 * next piece of work.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    key: "groupReview",
    items: [
      { key: "dashboard", icon: LayoutDashboardIcon, href: "/" },
      { key: "claims", icon: ClipboardCheckIcon, href: "/claims" },
      { key: "identity", icon: ShieldCheckIcon, href: null },
      { key: "guardians", icon: GavelIcon, href: null },
    ],
  },
  {
    key: "groupAccounts",
    items: [
      { key: "owners", icon: UsersIcon, href: null },
      { key: "heirs", icon: ScrollTextIcon, href: null },
      { key: "devices", icon: SmartphoneIcon, href: null },
      { key: "subscriptions", icon: CreditCardIcon, href: null },
    ],
  },
  {
    key: "groupOperations",
    items: [
      { key: "checkins", icon: HeartPulseIcon, href: null },
      { key: "releases", icon: UnlockIcon, href: null },
      { key: "email", icon: MailIcon, href: null },
      { key: "jobs", icon: TimerIcon, href: null },
    ],
  },
  {
    key: "groupRecords",
    items: [
      { key: "audit", icon: FileClockIcon, href: null },
      { key: "notifications", icon: BellIcon, href: null },
    ],
  },
]

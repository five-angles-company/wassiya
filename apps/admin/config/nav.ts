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
   *
   * Nothing is `null` today; the type stays so the next unbuilt section has a
   * place to sit that is not a dead link.
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
 * All four groups resolve. The sidebar was worked group by group in that
 * order — Review first, because it is what the console exists for: the
 * human-judgement path a death claim walks.
 *
 * Every screen's filters live in the URL, which is what lets the dashboard's
 * tiles link at a filtered list rather than a landing page — see `stat-card`
 * and `use-table-url-state`.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    key: "groupReview",
    items: [
      { key: "dashboard", icon: LayoutDashboardIcon, href: "/" },
      { key: "claims", icon: ClipboardCheckIcon, href: "/claims" },
      { key: "identity", icon: ShieldCheckIcon, href: "/identity" },
      { key: "guardians", icon: GavelIcon, href: "/guardians" },
    ],
  },
  {
    key: "groupAccounts",
    items: [
      { key: "owners", icon: UsersIcon, href: "/owners" },
      { key: "heirs", icon: ScrollTextIcon, href: "/heirs" },
      { key: "devices", icon: SmartphoneIcon, href: "/devices" },
      { key: "subscriptions", icon: CreditCardIcon, href: "/subscriptions" },
    ],
  },
  {
    key: "groupOperations",
    items: [
      { key: "checkins", icon: HeartPulseIcon, href: "/checkins" },
      { key: "releases", icon: UnlockIcon, href: "/releases" },
      { key: "email", icon: MailIcon, href: "/email" },
      { key: "jobs", icon: TimerIcon, href: "/jobs" },
    ],
  },
  {
    key: "groupRecords",
    items: [
      { key: "audit", icon: FileClockIcon, href: "/audit" },
      { key: "notifications", icon: BellIcon, href: "/notifications" },
    ],
  },
]

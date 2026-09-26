import {
  LayersIcon,
  PlugIcon,
  ScaleIcon,
  UserCogIcon,
  KeyRoundIcon,
  SearchXIcon,
  BellIcon,
  BookOpenIcon,
  MessagesSquareIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  FileClockIcon,
  PackageOpenIcon,
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
   * The permission this screen needs, from the backend's catalogue
   * (`convex/model/permissions.ts`).
   *
   * The sidebar hides an item its viewer cannot use, and a group with nothing
   * left in it goes too — a console that lists every screen a delivery agent
   * may not open reads as broken rather than as scoped. The screen behind it
   * refuses on its own (`RequirePermission`), and the query behind *that* is
   * the actual boundary, so this is presentation and nothing more.
   */
  need: string
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
  /** A live count beside the label; see `components/nav-badge.tsx`. */
  badge?: "supportUnassigned"
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
      {
        key: "dashboard",
        icon: LayoutDashboardIcon,
        href: "/",
        need: "dashboard.read",
      },
      {
        key: "claims",
        icon: ClipboardCheckIcon,
        href: "/claims",
        need: "claims.read",
      },
      // Beside claims, not inside them: an unmatched report is a claim whose
      // owner was never found, and it is worked with a different action.
      {
        key: "unmatched",
        icon: SearchXIcon,
        href: "/unmatched",
        need: "claims.read",
      },
      {
        key: "deliveries",
        icon: PackageOpenIcon,
        href: "/deliveries",
        need: "deliveries.read",
      },
      {
        key: "identity",
        icon: ShieldCheckIcon,
        href: "/identity",
        need: "identity.read",
      },
    ],
  },
  {
    key: "groupSupport",
    items: [
      {
        key: "support",
        icon: MessagesSquareIcon,
        href: "/support",
        need: "support.read",
        badge: "supportUnassigned",
      },
      {
        key: "helpCenter",
        icon: BookOpenIcon,
        href: "/support/help",
        need: "support.read",
      },
    ],
  },
  {
    key: "groupAccounts",
    items: [
      { key: "owners", icon: UsersIcon, href: "/owners", need: "owners.read" },
      {
        key: "executors",
        icon: ScrollTextIcon,
        href: "/executors",
        need: "owners.read",
      },
      {
        key: "devices",
        icon: SmartphoneIcon,
        href: "/devices",
        need: "owners.read",
      },
      {
        key: "subscriptions",
        icon: CreditCardIcon,
        href: "/subscriptions",
        need: "billing.read",
      },
    ],
  },
  {
    key: "groupOperations",
    items: [
      {
        key: "checkins",
        icon: HeartPulseIcon,
        href: "/checkins",
        need: "owners.read",
      },
      {
        key: "releases",
        icon: UnlockIcon,
        href: "/releases",
        need: "claims.read",
      },
      { key: "email", icon: MailIcon, href: "/email", need: "ops.read" },
      { key: "jobs", icon: TimerIcon, href: "/jobs", need: "jobs.read" },
    ],
  },
  {
    key: "groupSettings",
    items: [
      {
        key: "integrations",
        icon: PlugIcon,
        href: "/settings/integrations",
        need: "settings.read",
      },
      {
        key: "settingsPlans",
        icon: LayersIcon,
        href: "/settings/plans",
        need: "settings.read",
      },
      {
        key: "policy",
        icon: ScaleIcon,
        href: "/settings/policy",
        need: "settings.read",
      },
    ],
  },
  {
    // Its own group rather than a line under Settings. Who may enter the
    // console and what a role carries are two different jobs, worked at
    // different moments, and neither is a deployment setting.
    key: "groupStaff",
    items: [
      { key: "staff", icon: UserCogIcon, href: "/team", need: "staff.read" },
      { key: "roles", icon: KeyRoundIcon, href: "/roles", need: "staff.read" },
    ],
  },
  {
    key: "groupRecords",
    items: [
      { key: "audit", icon: FileClockIcon, href: "/audit", need: "audit.read" },
      {
        key: "notifications",
        icon: BellIcon,
        href: "/notifications",
        need: "ops.read",
      },
    ],
  },
]

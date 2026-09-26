// The permission catalogue: every authority the console can hand out.
//
// This file is the *code* half of RBAC. Which keys a role holds is data
// (`staffRoles`), and which roles a person holds is data (`users.staffRoleIds`)
// — but the set of things that can be gated at all is fixed at deploy time, so
// nobody mints authority by typing a new string into a form.
//
// Two rules keep it honest:
//
// 1. **A key is added here before it is used.** `requirePermission` takes the
//    union below, and `verify-invariants.mjs` re-checks every gate in the
//    backend against this list — a typo is a failed build, not a function
//    nobody can call.
// 2. **Groups mirror the console's nav groups.** The role editor renders its
//    checkboxes by group, so an Owner ticking boxes is looking at the sidebar
//    they are building for someone else.
//
// Pure data — no Convex imports beyond the job list, so the build script can
// read it with a regex and the admin app can import the labels' keys.
import type { JobName } from "./jobRuns"

export const PERMISSION_GROUPS = [
  "review",
  "support",
  "accounts",
  "operations",
  "settings",
  "records",
] as const

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number]

/**
 * Every key, with the group it renders under.
 *
 * Read-vs-act is the seam, not screen-by-screen: staff who can see a delivery
 * mostly should, and what separates a Reviewer from a delivery agent is which
 * *decisions* they may take. Splitting reads any finer produces roles that
 * cannot answer a phone call about a case they are working.
 */
export const PERMISSIONS = [
  { key: "dashboard.read", group: "review" },
  { key: "claims.read", group: "review" },
  /** Rule on a death report: link a subject, set the name match, close it. */
  { key: "claims.rule", group: "review" },
  { key: "deliveries.read", group: "review" },
  /** Reach an executor: log an attempt, correct a number, resend, reissue. */
  { key: "deliveries.contact", group: "review" },
  /** Decide an executor's identity by hand when no ID number matched. */
  { key: "deliveries.decide", group: "review" },
  { key: "identity.read", group: "review" },
  /** Give an owner their three Didit attempts back. */
  { key: "identity.reset", group: "review" },
  { key: "support.read", group: "support" },
  /** Answer a thread, add a staff note, take or resolve a thread. */
  { key: "support.reply", group: "support" },
  /** Assign threads to others and edit the help center. */
  { key: "support.manage", group: "support" },
  { key: "owners.read", group: "accounts" },
  { key: "billing.read", group: "accounts" },
  /**
   * Entitlement. One key for all three writers, because they are one decision
   * wearing three faces — see AGENTS.md on why an override is the quietest of
   * them and therefore not a lesser permission.
   */
  { key: "billing.manage", group: "accounts" },
  /** The email log and the notification log. */
  { key: "ops.read", group: "operations" },
  { key: "jobs.read", group: "operations" },
  /**
   * One key per job, not one for the lot.
   *
   * `deliveries.expire` can delete a whole vault forever; a staff
   * member who should be able to nudge `claims.advance` must not inherit that
   * because both happen to be buttons on the same screen.
   */
  { key: "jobs.run:checkin.sweep", group: "operations" },
  { key: "jobs.run:claims.advance", group: "operations" },
  { key: "jobs.run:claims.sweepUnmatched", group: "operations" },
  { key: "jobs.run:deliveries.expire", group: "operations" },
  { key: "jobs.run:support.purgeFiles", group: "operations" },
  { key: "settings.read", group: "settings" },
  { key: "settings.manage", group: "settings" },
  { key: "staff.read", group: "settings" },
  /** Invite, revoke, assign roles, edit roles. The key that makes keys. */
  { key: "staff.manage", group: "settings" },
  { key: "audit.read", group: "records" },
] as const satisfies readonly { key: string; group: PermissionGroup }[]

export type PermissionKey = (typeof PERMISSIONS)[number]["key"]

export const PERMISSION_KEYS: readonly PermissionKey[] = PERMISSIONS.map(
  (entry) => entry.key
)

/**
 * The wildcard the system Owner role holds.
 *
 * Not an enumeration of `PERMISSION_KEYS`: a key added by a later deploy has
 * to be held by the person who administers the console *on the day it ships*,
 * or every catalogue addition is a silent lockout that surfaces as "this
 * button does nothing". Rejected on every other role.
 */
export const ALL_PERMISSIONS = "*"

/**
 * The key that gates running one job by hand.
 *
 * A `Record<JobName, …>` rather than string interpolation so that adding a job
 * to `JOB_NAMES` without minting its key fails to compile. The colon keeps the
 * job's own dotted name unambiguous against the dotted key namespace.
 */
export const JOB_RUN_PERMISSION: Record<JobName, PermissionKey> = {
  "checkin.sweep": "jobs.run:checkin.sweep",
  "claims.advance": "jobs.run:claims.advance",
  "claims.sweepUnmatched": "jobs.run:claims.sweepUnmatched",
  "deliveries.expire": "jobs.run:deliveries.expire",
  "support.purgeFiles": "jobs.run:support.purgeFiles",
}

export function isPermissionKey(value: string): value is PermissionKey {
  return (PERMISSION_KEYS as readonly string[]).includes(value)
}

/**
 * The four roles a deployment starts with, seeded by `staff.seedRoles`.
 *
 * Shaped by what the console is actually worked as: a **Reviewer** rules on
 * death reports, a **Delivery agent** gets the estate to the executor, and
 * **Support** answers the phone — which needs to see almost everything and
 * change almost nothing, plus the one unblocking action (Didit attempts) that
 * is the most common ticket.
 *
 * Seeded, not fixed: every one of them except Owner can be edited or deleted
 * in the console, and these are only where a deployment begins.
 */
export const SEEDED_ROLES = [
  {
    key: "owner",
    system: true,
    name: { ar: "مالك النظام", en: "Owner" },
    description: {
      ar: "كل الصلاحيات، بما فيها إدارة الفريق والإعدادات.",
      en: "Everything, including staff and settings.",
    },
    permissions: [ALL_PERMISSIONS],
  },
  {
    key: "reviewer",
    system: false,
    name: { ar: "مُدقّق البلاغات", en: "Reviewer" },
    description: {
      ar: "يفحص شهادات الوفاة ويبتّ في البلاغات.",
      en: "Checks death certificates and rules on reports.",
    },
    permissions: [
      "dashboard.read",
      "claims.read",
      "claims.rule",
      "deliveries.read",
      "identity.read",
      "owners.read",
      "ops.read",
      "audit.read",
    ],
  },
  {
    key: "delivery",
    system: false,
    name: { ar: "مسؤول التسليم", en: "Delivery agent" },
    description: {
      ar: "يتواصل مع الورثة ويبتّ في مطابقة هوياتهم.",
      en: "Contacts executors and decides their identity match.",
    },
    permissions: [
      "dashboard.read",
      "claims.read",
      "deliveries.read",
      "deliveries.contact",
      "deliveries.decide",
      "identity.read",
      "owners.read",
      "ops.read",
      "audit.read",
    ],
  },
  {
    key: "support",
    system: false,
    name: { ar: "الدعم", en: "Support" },
    description: {
      ar: "اطّلاع على كل شيء، دون قرارات — عدا إعادة محاولات التحقق.",
      en: "Reads everything, decides nothing — except resetting ID attempts.",
    },
    permissions: [
      "dashboard.read",
      "claims.read",
      "deliveries.read",
      "identity.read",
      "identity.reset",
      "support.read",
      "support.reply",
      "support.manage",
      "owners.read",
      "billing.read",
      "ops.read",
      "jobs.read",
      "settings.read",
      "audit.read",
    ],
  },
] as const satisfies readonly {
  key: string
  system: boolean
  name: { ar: string; en: string }
  description: { ar: string; en: string }
  permissions: readonly string[]
}[]

/** The slug of the one role that may never be edited, deleted or emptied. */
export const OWNER_ROLE_KEY = "owner"

// A seeded role naming a key the catalogue does not have must fail the build,
// not seed a role with a dead permission. Checked by assignment rather than at
// seed time, so deleting a key surfaces here instead of on a deployment.
const seededKeys: readonly (PermissionKey | typeof ALL_PERMISSIONS)[] =
  SEEDED_ROLES.flatMap((role) => role.permissions)

/** Every key the seeded roles name, for `staff.seedRoles` to validate against. */
export const SEEDED_PERMISSION_KEYS = seededKeys

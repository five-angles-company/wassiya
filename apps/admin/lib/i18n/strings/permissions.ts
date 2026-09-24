import type { Dictionary, LabelSet } from "@/lib/i18n/locale"

/**
 * What each permission lets someone do, in words an operator can tick a box
 * against.
 *
 * The keys are the backend catalogue's (`convex/model/permissions.ts`) and the
 * labels are here, for the same reason `audit-domains.ts` exists: the backend
 * emits stable identifiers and the console is where they become readable. A
 * key with no entry renders as itself, which is ugly but honest — better a
 * visible `jobs.run:new.sweep` than a checkbox with no name.
 *
 * Each label is a *capability*, not a screen. "Rule on death reports" is what
 * the permission grants; which pages that lights up is the sidebar's business
 * and changes without the meaning changing.
 */
export const PERMISSION_GROUPS = {
  review: { ar: "المراجعة", en: "Review" },
  support: { ar: "الدعم", en: "Support" },
  accounts: { ar: "الحسابات", en: "Accounts" },
  operations: { ar: "التشغيل", en: "Operations" },
  settings: { ar: "الإعدادات", en: "Settings" },
  records: { ar: "السجلّات", en: "Records" },
} as const satisfies Dictionary

export const PERMISSION_LABELS: Record<string, LabelSet> = {
  "dashboard.read": { ar: "لوحة المؤشّرات", en: "The dashboard" },
  "claims.read": { ar: "قراءة بلاغات الوفاة", en: "Read death reports" },
  "claims.rule": {
    ar: "البتّ في البلاغات: مطابقة الاسم، الربط، الإغلاق",
    en: "Rule on reports: name match, linking, closing",
  },
  "deliveries.read": { ar: "قراءة التسليمات", en: "Read deliveries" },
  "deliveries.contact": {
    ar: "التواصل مع الورثة: تسجيل محاولة، تصحيح رقم، إعادة الرابط",
    en: "Reach heirs: log an attempt, fix a number, reissue the link",
  },
  "deliveries.decide": {
    ar: "البتّ في هوية الوارث يدوياً",
    en: "Decide an heir's identity by hand",
  },
  "identity.read": {
    ar: "قراءة طوابير التحقّق",
    en: "Read the identity queue",
  },
  "identity.reset": {
    ar: "إعادة محاولات التحقّق لمالك",
    en: "Give an owner their verification attempts back",
  },
  "support.read": {
    ar: "قراءة محادثات الدعم ومركز المساعدة",
    en: "Read support conversations and the help center",
  },
  "support.reply": {
    ar: "الردّ على المحادثات، الملاحظات الداخلية، الإغلاق",
    en: "Reply to threads, add internal notes, resolve",
  },
  "support.manage": {
    ar: "إسناد المحادثات للآخرين وتحرير مركز المساعدة",
    en: "Assign threads to others and edit the help center",
  },
  "owners.read": {
    ar: "قراءة الحسابات: الملّاك، الورثة، الأجهزة، النبض",
    en: "Read accounts: owners, heirs, devices, check-ins",
  },
  "billing.read": {
    ar: "قراءة الاشتراكات والخطط",
    en: "Read plans and subscriptions",
  },
  "billing.manage": {
    ar: "تغيير الاستحقاق: الخطط، الحدود، الاستثناءات",
    en: "Change entitlement: plans, limits, overrides",
  },
  "ops.read": {
    ar: "سجلّ البريد والإشعارات",
    en: "The email and notification logs",
  },
  "jobs.read": { ar: "قراءة نبض المهام", en: "Read the job heartbeat" },
  "jobs.run:checkin.sweep": {
    ar: "تشغيل مسح النبض يدوياً",
    en: "Run the check-in sweep by hand",
  },
  "jobs.run:claims.advance": {
    ar: "تشغيل تقدّم البلاغات يدوياً",
    en: "Run the claims advance by hand",
  },
  "jobs.run:claims.sweepUnmatched": {
    ar: "تشغيل مسح البلاغات غير المطابقة",
    en: "Run the unmatched-claims sweep",
  },
  "jobs.run:deliveries.expire": {
    ar: "تشغيل إتلاف التسليمات المنتهية — لا رجعة فيه",
    en: "Run delivery expiry — destroys keys, irreversibly",
  },
  "jobs.run:support.purgeFiles": {
    ar: "تشغيل حذف مرفقات الدعم القديمة",
    en: "Run the support-file purge",
  },
  "settings.read": {
    ar: "قراءة الإعدادات والسياسات",
    en: "Read settings and policy",
  },
  "settings.manage": {
    ar: "تغيير الإعدادات: المُرسِل، التواصل، الروابط",
    en: "Change settings: sender, outreach, links",
  },
  "staff.read": {
    ar: "قراءة الفريق وأدواره",
    en: "Read the team and its roles",
  },
  "staff.manage": {
    ar: "دعوة الفريق وتعديل الأدوار والصلاحيات",
    en: "Invite staff, edit roles and permissions",
  },
  "audit.read": { ar: "قراءة سجلّ التدقيق", en: "Read the audit log" },
}

import type { Dictionary } from "@/lib/i18n/locale"

export const STAFF = {
  // ── The members screen ───────────────────────────────────────────────────
  pageTitle: { ar: "أعضاء الفريق", en: "Team members" },
  intro: {
    ar: "من يدخل هذه اللوحة. الدعوة المعلّقة صفٌّ هنا أيضاً: هي وصول لم يبدأ بعد، لا قائمة أخرى.",
    en: "Who gets into this console. A pending invitation is a row here too — it is access that has not started yet, not a separate list.",
  },
  searchPlaceholder: {
    ar: "ابحث بالاسم أو البريد",
    en: "Search by name or email",
  },
  staffEmpty: { ar: "لا أحد بعد", en: "Nobody yet" },
  staffEmptyHint: {
    ar: "ادعُ أول عضو بالبريد، وتسري أدواره عند أول دخول له.",
    en: "Invite the first member by email; their roles apply the first time they sign in.",
  },

  colPerson: { ar: "الشخص", en: "Person" },
  colRoles: { ar: "الأدوار", en: "Roles" },
  colStatus: { ar: "الحالة", en: "Status" },
  colSince: { ar: "منذ", en: "Since" },
  colActions: { ar: "إجراءات", en: "Actions" },

  statusOwner: { ar: "مالك النظام", en: "Owner" },
  statusActive: { ar: "نشط", en: "Active" },
  statusNoRoles: { ar: "بلا أدوار", en: "No roles" },
  statusInvited: { ar: "دعوة معلّقة", en: "Invited" },
  statusExpired: { ar: "دعوة منتهية", en: "Invitation expired" },

  noRoles: { ar: "بلا دور", en: "No role" },
  since: { ar: "منذ {date}", en: "Since {date}" },
  editRoles: { ar: "الأدوار", en: "Roles" },
  seeActions: { ar: "أفعاله", en: "Their actions" },
  remove: { ar: "إخراج من الفريق", en: "Take off staff" },
  removeTitle: { ar: "إخراج من الفريق؟", en: "Take off staff?" },
  removeBody: {
    ar: "يفقد الدخول إلى اللوحة فوراً. حسابه وسجلّ أفعاله يبقيان كما هما.",
    en: "They lose the console immediately. Their account and everything they did stay on record.",
  },
  self: { ar: "أنت", en: "You" },
  selfHint: {
    ar: "لا يغيّر أحد صلاحيات نفسه — يحتاج إلى مالك نظام آخر.",
    en: "Nobody changes their own access; that takes another Owner.",
  },

  // ── Assigning ────────────────────────────────────────────────────────────
  assignTitle: { ar: "أدوار {name}", en: "{name}'s roles" },
  assignBody: {
    ar: "يسري التغيير فوراً. لا يمكن منح صلاحية لا تملكها أنت.",
    en: "This takes effect immediately. You cannot grant a permission you do not hold yourself.",
  },
  assignSave: { ar: "حفظ الأدوار", en: "Save roles" },
  assignSaved: { ar: "حُدّثت الأدوار", en: "Roles updated" },

  // ── Inviting ─────────────────────────────────────────────────────────────
  invite: { ar: "دعوة", en: "Invite" },
  inviteTitle: { ar: "دعوة إلى اللوحة", en: "Invite to the console" },
  inviteBody: {
    ar: "لا يُمنح شيء الآن. تصل رسالة، وتسري الأدوار عند أول دخول بالبريد نفسه.",
    en: "Nothing is granted now. A message goes out, and the roles apply the first time that address signs in.",
  },
  inviteEmail: { ar: "البريد", en: "Email" },
  inviteEnglish: {
    ar: "أرسل الرسالة بالإنجليزية",
    en: "Send the message in English",
  },
  inviteSend: { ar: "إرسال الدعوة", en: "Send invitation" },
  inviteSent: { ar: "أُرسلت الدعوة", en: "Invitation sent" },
  // Names the way out rather than the cause: the message is skipped when
  // either the sender address or the console URL is missing, and "copy the
  // link from its row" is the answer to both — the row itself says when there
  // is no link to copy.
  inviteSavedNoMail: {
    ar: "أُنشئت الدعوة ولم تُرسل رسالة — انسخ الرابط من صفّها وأرسله بنفسك.",
    en: "Invitation created, but no message went out — copy the link from its row and send it yourself.",
  },
  invitedAt: { ar: "دُعي {date}", en: "Invited {date}" },

  // Handing an invitation over yourself, for when no message went out.
  //
  // ⚠️ **A bare URL is not an invitation.** There is no token: the roles bind
  // to the address, so a link without the address names no invitation at all,
  // and the person receiving it cannot tell which of their addresses to use.
  // What goes on the clipboard is therefore a whole message, and it says the
  // same three things `STAFF_INVITE_COPY` says in `convex/model/emailCopy.ts`
  // — where the address is implicit because the mail arrives at it. **The two
  // must stay in step.**
  copyInvite: { ar: "نسخ الدعوة", en: "Copy invitation" },
  // The URL and the address each end their own line. Plain text carries no
  // `dir`, so a machine string sitting mid-sentence in Arabic is reordered by
  // whatever chat app it is pasted into — the same reason every address in this
  // console is wrapped in a `dir="ltr"` span.
  inviteMessage: {
    ar: "دُعيت للعمل على لوحة تحكّم وصيّة. افتح الرابط وسجّل الدخول بالبريد الموضّح أدناه. تنتهي الدعوة في {date}، ولا يُمنح شيء قبل تسجيل الدخول.\nاللوحة: {link}\nالبريد: {email}",
    en: "You have been invited to work on the Wassiya console. Open the link and sign in with the address below. The invitation expires on {date}, and nothing is granted until you sign in.\nConsole: {link}\nEmail: {email}",
  },
  inviteCopied: {
    ar: "نُسخت الدعوة — أرسلها إلى {email}",
    en: "Invitation copied — send it to {email}",
  },
  copyNoUrl: {
    ar: "لا رابط: اضبط عنوان اللوحة في الإعدادات.",
    en: "No link: set the console URL in settings.",
  },

  revoke: { ar: "إلغاء", en: "Revoke" },
  revokeTitle: { ar: "إلغاء الدعوة؟", en: "Revoke the invitation?" },
  revokeBody: {
    ar: "لن تسري إن دخل صاحبها بعد ذلك. يمكن إرسال دعوة جديدة في أي وقت.",
    en: "It will not bind if they sign in later. A new one can be sent at any time.",
  },
  revoked: { ar: "أُلغيت الدعوة", en: "Invitation revoked" },

  // ── The roles screen ─────────────────────────────────────────────────────
  rolesTitle: { ar: "الأدوار", en: "Roles" },
  rolesIntro: {
    ar: "الصلاحيات المتاحة تأتي من الكود؛ ما يحمله كل دور منها يُحرَّر هنا. تعديل دور يسري فوراً على كل من يحمله، في كل نافذة مفتوحة لديه.",
    en: "Which permissions exist comes from the code; what each role holds is edited here. Saving a role applies at once to everyone holding it, in every tab they have open.",
  },
  searchRoles: { ar: "ابحث في الأدوار", en: "Search roles" },
  rolesEmpty: { ar: "لا أدوار", en: "No roles" },
  rolesEmptyHint: {
    ar: "شغّل staff:seedRoles لإنشاء الأدوار الأربعة الأولى.",
    en: "Run staff:seedRoles to create the four starting roles.",
  },
  colRole: { ar: "الدور", en: "Role" },
  colScope: { ar: "ما يشمله", en: "Scope" },
  colHolders: { ar: "من يحمله", en: "Held by" },
  newRole: { ar: "دور جديد", en: "New role" },
  roleHolders: { ar: "{count} شخص", en: "{count} people" },
  roleHoldersOne: { ar: "شخص واحد", en: "1 person" },
  roleHoldersNone: { ar: "لا أحد", en: "Nobody" },
  rolePermissions: { ar: "{count} صلاحية", en: "{count} permissions" },
  roleAll: { ar: "كل الصلاحيات", en: "Every permission" },
  roleSystem: { ar: "دور ثابت", en: "Fixed role" },
  roleSystemHint: {
    ar: "لا يُعدَّل ولا يُحذف، ويشمل كل صلاحية تُضاف لاحقاً — وإلا لأُغلق الباب على من يدير النظام يوم إضافتها.",
    en: "Cannot be edited or deleted, and holds every permission added later — otherwise each new one would lock out the person who administers the system.",
  },

  // ── Role editor ──────────────────────────────────────────────────────────
  roleEditTitle: { ar: "تعديل الدور", en: "Edit role" },
  roleNewTitle: { ar: "دور جديد", en: "New role" },
  roleEditBody: {
    ar: "اختر ما يستطيعه من يحمل هذا الدور. تظهر لك الصلاحيات التي تملكها أنت فقط.",
    en: "Choose what someone holding this role can do. You only see permissions you hold yourself.",
  },
  roleNameAr: { ar: "الاسم بالعربية", en: "Name in Arabic" },
  roleNameEn: { ar: "الاسم بالإنجليزية", en: "Name in English" },
  roleDescAr: { ar: "الوصف بالعربية", en: "Description in Arabic" },
  roleDescEn: { ar: "الوصف بالإنجليزية", en: "Description in English" },
  roleSave: { ar: "حفظ الدور", en: "Save role" },
  roleCreate: { ar: "إنشاء الدور", en: "Create role" },
  roleSaved: { ar: "حُفظ الدور", en: "Role saved" },
  roleCreated: { ar: "أُنشئ الدور", en: "Role created" },
  roleDelete: { ar: "حذف الدور", en: "Delete role" },
  roleDeleteTitle: { ar: "حذف الدور؟", en: "Delete the role?" },
  roleDeleteBody: {
    ar: "لا يمكن حذف دور يحمله أحد — انقل من يحملونه أولاً.",
    en: "A role that people still hold cannot be deleted — move them off it first.",
  },
  roleDeleted: { ar: "حُذف الدور", en: "Role deleted" },

  cancel: { ar: "إلغاء", en: "Cancel" },
  saving: { ar: "يحفظ…", en: "Saving…" },
  failed: { ar: "تعذّر التنفيذ", en: "That did not work" },
} as const satisfies Dictionary

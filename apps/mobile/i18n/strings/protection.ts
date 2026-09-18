/**
 * ٦ — الحماية.
 *
 * The behaviour these strings describe is fixed by AGENTS.md's locked security
 * model and by `convex/checkin.ts` and `convex/guardians.ts` — the ladder, the
 * cadence and what a guardian is for are not copy decisions. The wording and the
 * arrangement are ours.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٦.١ — the Protection Centre. */
export const PROTECTION = {
  title: { ar: "الحماية", en: "Protection" },
  scoreLabel: { ar: "قوة حمايتك", en: "Your protection" },
  scoreComplete: {
    ar: "خزنتك محميّة بالكامل",
    en: "Your vault is fully protected",
  },
  scoreIncomplete: {
    ar: "أكمل الخطوات التالية لتكتمل حمايتك",
    en: "Finish these steps to complete your protection",
  },

  // Each row is a real gate, and each links to the screen that closes it.
  itemIdentity: { ar: "التحقق من الهوية", en: "Identity verified" },
  itemKey: { ar: "مفتاح الخزنة", en: "Vault key" },
  itemSheet: { ar: "وثيقة الاسترداد مطبوعة", en: "Recovery sheet printed" },
  itemGuardian: { ar: "الوصي", en: "Guardian" },
  itemHeirs: { ar: "الورثة", en: "Heirs" },
  itemRouting: { ar: "توجيه الأصول", en: "Asset routing" },
  itemCheckin: { ar: "تأكيد الحياة", en: "Life check-in" },

  needed: { ar: "مطلوب", en: "Needed" },
  later: { ar: "لاحقاً", en: "Later" },

  // This used to read "without a guardian, the printed sheet alone cannot
  // recover your vault" — which became false the moment K_rec stopped needing
  // a second share. The urgency is real but it was pointed at the wrong risk:
  // a guardian now protects *delivery*, and a vault without one releases a box
  // no heir can open.
  guardianUrgent: {
    ar: "بدون وصي، لا يستطيع ورثتك فتح ما تركته لهم.",
    en: "Without a guardian, your heirs cannot open what you leave them.",
  },
} satisfies LabelSet<string>

/** ٦.٢ — the guardian, owner side. */
export const GUARDIAN = {
  title: { ar: "الوصي", en: "Your guardian" },
  intro: {
    ar: "الوصي شخص تثق به يحتفظ بنصف مفتاح التسليم لكل وارث. لا يرى محتوى خزنتك أبداً، وهو من يبلّغ عن وفاتك ويقدّم شهادة الوفاة.",
    en: "A guardian is someone you trust who holds half of the delivery key for each heir. They never see your vault's contents, and they are the person who reports your death and provides the certificate.",
  },
  // The half-sentence that makes the model legible in one read. It used to
  // describe recovery; recovery is the sheet alone now, so this is delivery.
  howItWorks: {
    ar: "نصيب الوصي + نصيب الخادم = فتح صندوق الوارث. لا خزنتك ولا استعادتك تمرّان به.",
    en: "Your guardian's share + the server's share = an heir's box opens. Neither your vault nor your recovery passes through them.",
  },

  nameLabel: { ar: "اسم الوصي", en: "Guardian's name" },
  namePlaceholder: { ar: "خالد المنصوري", en: "Khaled Al-Mansouri" },
  relationLabel: { ar: "صلة القرابة", en: "Relationship" },
  relationPlaceholder: { ar: "أخ", en: "Brother" },
  invite: { ar: "أنشئ دعوة", en: "Create invitation" },
  inviting: { ar: "جارٍ الإنشاء…", en: "Creating…" },

  // The token travels out of band, deliberately — the server never sees a
  // channel it could also intercept.
  inviteReady: { ar: "الدعوة جاهزة", en: "Invitation ready" },
  inviteBody: {
    ar: "أرسل هذا الرمز إلى {name} بطريقة تثق بها. يصلح مرة واحدة، وينتهي خلال ٧ أيام.",
    en: "Send this code to {name} by a channel you trust. It works once, and expires in 7 days.",
  },
  share: { ar: "أرسل الدعوة", en: "Send the invitation" },
  // Points at the website, not the app: a guardian has no reason to install
  // the mobile app, which is the owner's.
  // ⚠️ Carries the **link**, not a bare code. It used to say "open the Wassiya
  // website and enter this code" — and that page has no field to enter one, so
  // an invited guardian reached a screen that could not take what they were
  // holding. The code stays in the message underneath, for a messaging app that
  // mangles a long URL; the accept page can take it pasted.
  // ⚠️ Carries the **link**, not a bare code. It used to say "open the Wassiya
  // website and enter this code" — and that page has no field to enter one, so
  // an invited guardian reached a screen that could not take what they were
  // holding. The code stays underneath, for a messaging app that mangles a long
  // URL; the accept page takes it pasted.
  inviteMessage: {
    ar: "دعوتك لتكون وصياً على خزنة وصيّة. افتح هذا الرابط:\n{link}\n\nإن لم يعمل الرابط، افتح موقع وصيّة وألصق هذا الرمز:\n{token}",
    en: "You have been asked to be a guardian for a Wassiya vault. Open this link:\n{link}\n\nIf the link does not work, open the Wassiya website and paste this code:\n{token}",
  },
  // No link to give, because `EXPO_PUBLIC_APP_URL` is unset. Naming the site
  // beats a message that names none.
  inviteMessageNoLink: {
    ar: "دعوتك لتكون وصياً على خزنة وصيّة. افتح موقع وصيّة، واذهب إلى صفحة قبول الوصاية، وألصق هذا الرمز:\n{token}",
    en: "You have been asked to be a guardian for a Wassiya vault. Open the Wassiya website, go to the guardian acceptance page, and paste this code:\n{token}",
  },

  statusInvited: { ar: "بانتظار القبول", en: "Waiting to accept" },
  statusAccepted: { ar: "قبل الدعوة", en: "Accepted" },
  statusActive: { ar: "مفعّل", en: "Active" },
  statusRevoked: { ar: "مُلغى", en: "Revoked" },

  // The seal ceremony that used to live here is gone: it sealed the *recovery*
  // share, and there is no such share. What is left is a wait, and the copy
  // says whose it is — the owner has nothing to do and no way to hurry it.
  awaitingAcceptance: {
    ar: "الدعوة جاهزة — أرسلها لوصيّك بنفسك. يقبلها من الرابط، ثم لا شيء مطلوب منك.",
    en: "The invitation is ready — send it to your guardian yourself. They accept from the link, and nothing more is needed from you.",
  },
  acceptedBody: {
    ar: "قبل وصيّك ونشر مفتاحه. أصبح بإمكان ورثتك استلام ما تركته لهم.",
    en: "Your guardian accepted and published their key. Your heirs can now receive what you leave them.",
  },

  revoke: { ar: "ألغِ الوصي", en: "Remove guardian" },
  revokeTitle: { ar: "إلغاء الوصي؟", en: "Remove this guardian?" },
  // No longer mentions reissuing the sheet: the sheet has nothing to do with
  // the guardian now, and telling an owner to reprint would be busywork that
  // also puts a live recovery code on a printer for no reason.
  revokeBody: {
    ar: "لن يعود بإمكانه تأكيد وفاتك أو مساعدة ورثتك على الفتح. اختر وصياً بديلاً.",
    en: "They will no longer be able to confirm your death or help your heirs open their box. Choose a replacement.",
  },
  revokeConfirm: { ar: "ألغِ", en: "Remove" },
  cancel: { ar: "إلغاء", en: "Cancel" },

  emptyTitle: { ar: "لم تختر وصياً بعد", en: "No guardian yet" },
} satisfies LabelSet<string>


/** ٦.٤ — the life check-in. */
export const CHECKIN = {
  // Says where the button went, so this screen isn't a dead end for anyone
  // who came here looking for it.
  confirmOnHome: {
    ar: "تأكيد الحياة يتم من الشاشة الرئيسية، ببصمتك.",
    en: "You confirm you're well from the home screen, with your fingerprint.",
  },
  title: { ar: "تأكيد الحياة", en: "Life check-in" },
  intro: {
    ar: "نسألك بين حين وآخر إن كنت بخير. إذا لم تجب خلال المهلة، تبدأ إجراءات التسليم لورثتك.",
    en: "We ask now and then whether you're well. If you don't answer within the grace period, delivery to your heirs begins.",
  },

  // The sheet titles itself with the words on the link that opened it —
  // "إعدادات النبض" — not with the section name. `title` still names the route.
  settingsTitle: { ar: "إعدادات النبض", en: "Pulse settings" },
  cadenceLabel: { ar: "كل كم شهر نسألك؟", en: "How often should we ask?" },
  cadence3: { ar: "٣ أشهر", en: "3 months" },
  cadence6: { ar: "٦ أشهر", en: "6 months" },
  cadence12: { ar: "١٢ شهراً", en: "12 months" },
  graceLabel: { ar: "المهلة قبل التصعيد", en: "Grace before escalation" },
  grace14: { ar: "١٤ يوماً", en: "14 days" },
  grace30: { ar: "٣٠ يوماً", en: "30 days" },
  grace60: { ar: "٦٠ يوماً", en: "60 days" },
  save: { ar: "احفظ الإعداد", en: "Save settings" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },

  // The single confirm. Biometric-gated, and the only place in the entire
  // product where life may be confirmed.
  promptTitle: { ar: "هل أنت بخير؟", en: "Are you well?" },
  confirm: { ar: "أنا بخير", en: "I'm well" },
  confirmPrompt: {
    ar: "أثبت هويتك لتأكيد أنك بخير",
    en: "Confirm it's you to check in",
  },
  confirmed: { ar: "تم التأكيد. نراك بعد {n} شهراً.", en: "Confirmed. See you in {n} months." },
  snooze: { ar: "ذكّرني بعد أسبوع", en: "Remind me in a week" },
  lastConfirmed: { ar: "آخر تأكيد {date}", en: "Last confirmed {date}" },
  nextDue: { ar: "التأكيد القادم {date}", en: "Next check-in {date}" },
  overdue: {
    ar: "تأخّر التأكيد. أكّد الآن لإيقاف التصعيد.",
    en: "Your check-in is overdue. Confirm now to stop the escalation.",
  },
  biometricFailed: {
    ar: "لم يتم التحقق. التأكيد يحتاج بصمتك دائماً — ولن نقبله بأي طريقة أخرى.",
    en: "Not verified. Checking in always needs your biometrics — and we accept it no other way.",
  },
  notConfigured: {
    ar: "لم تفعّل تأكيد الحياة بعد. بدونه لن يبدأ التسليم لورثتك أبداً.",
    en: "Life check-in is off. Without it, delivery to your heirs never begins.",
  },
  enable: { ar: "فعّل تأكيد الحياة", en: "Turn on life check-in" },
} satisfies LabelSet<string>

/**
 * ٧.٥ — the owner's veto interrupt.
 *
 * The one screen of section ٧ that lives in the app rather than the web funnel,
 * and the reason is stated: *"it must reach a person who is alive, on their own
 * phone, with a biometric to cancel."* A veto is the assertion "I am not dead",
 * and it has to be provable by presence, not by a tap on an unlocked handset
 * someone else is holding.
 */
export const CLAIM_VETO = {
  title: { ar: "طلب وراثة على حسابك", en: "An inheritance claim on your account" },
  // Deliberately unalarming in tone and unambiguous in fact. Most claims are
  // genuine; the ones that are not are the reason this screen exists.
  intro: {
    ar: "تقدّم {name} بطلب للوصول إلى ما تركته. إن كنت تقرأ هذا، فأنت حيّ — وبإمكانك إيقاف الطلب.",
    en: "{name} has filed a claim to access what you left. If you're reading this, you're alive — and you can stop it.",
  },
  deadline: {
    ar: "إن لم توقفه قبل {date}، سيُفرج عمّا خُصّص لهم.",
    en: "If you don't stop it before {date}, what's routed to them will be released.",
  },
  daysLeft: { ar: "{n} يوماً متبقياً", en: "{n} days left" },

  // Home links here; it must NOT read as the veto itself. Stopping a claim is
  // biometric-gated and happens on the claim screen, not from a banner.
  review: { ar: "راجع الطلب", en: "Review the claim" },
  veto: { ar: "أوقف الطلب — أنا بخير", en: "Stop this claim — I'm well" },
  vetoing: { ar: "جارٍ الإيقاف…", en: "Stopping…" },
  vetoPrompt: {
    ar: "أثبت هويتك لإيقاف الطلب",
    en: "Confirm it's you to stop this claim",
  },
  vetoed: {
    ar: "أُوقف الطلب. لن يُفرج عن شيء، ولن يستطيع مقدّم الطلب المحاولة مجدداً لمدة ٩٠ يوماً.",
    en: "The claim is stopped. Nothing will be released, and the claimant cannot try again for 90 days.",
  },
  vetoFailed: {
    ar: "تعذّر إيقاف الطلب. لم يتغيّر شيء — حاول مرة أخرى.",
    en: "Could not stop the claim. Nothing changed — try again.",
  },
  biometricFailed: {
    ar: "لم يتم التحقق. إيقاف الطلب يحتاج بصمتك — وهذا ما يمنع شخصاً آخر من إيقافه نيابةً عنك.",
    en: "Not verified. Stopping a claim needs your biometrics — which is what stops someone else doing it for you.",
  },
  windowClosed: {
    ar: "انتهت مدة الاعتراض على هذا الطلب.",
    en: "The objection window for this claim has closed.",
  },

  // The other half of the honesty: doing nothing is also a decision.
  ignoreTitle: { ar: "إن لم تفعل شيئاً", en: "If you do nothing" },
  ignoreBody: {
    ar: "سيمضي الطلب في مساره: تأكيد الوصي، ثم الإفراج عمّا خُصّص لمقدّم الطلب وحده.",
    en: "The claim continues: your guardian confirms, then what's routed to that person alone is released.",
  },
  none: { ar: "لا توجد طلبات على حسابك.", en: "No claims against your account." },
} satisfies LabelSet<string>



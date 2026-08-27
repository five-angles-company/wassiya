/**
 * ٦ — الحماية.
 *
 * ⚠️ **This section's board design has never been readable.** The
 * `DesignSync` `get_file` cap is 256 KiB and the onboarding board is roughly
 * twice that, so every read stops inside section ٥. What is built here is
 * derived from sources that *are* authoritative — `AGENTS.md`'s locked security
 * model and section map (6.1 Centre, 6.2 guardian, 6.4 check-in), the backend's
 * own documented rules in `convex/checkin.ts` and `convex/guardians.ts`, and
 * the `@workspace/ui-native` primitives that a previous session built directly
 * from this section (`check-in-prompt` names 6.4 as its screen, and
 * `protection-score-list` names the Protection Centre).
 *
 * So the behaviour is sourced; the visual arrangement is inferred. When the
 * board is split into sub-256 KiB files, this copy is what to check first.
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

  // The one warning that outranks the others: without a guardian the printed
  // sheet cannot actually recover anything.
  guardianUrgent: {
    ar: "بدون وصي، وثيقة الاسترداد وحدها لا تكفي لاستعادة خزنتك.",
    en: "Without a guardian, the printed sheet alone cannot recover your vault.",
  },
} satisfies LabelSet<string>

/** ٦.٢ — the guardian, owner side. */
export const GUARDIAN = {
  title: { ar: "الوصي", en: "Your guardian" },
  intro: {
    ar: "الوصي شخص تثق به يحتفظ بنصف مفتاح الاسترداد. لا يرى محتوى خزنتك أبداً، ولا يستطيع فتحها وحده.",
    en: "A guardian is someone you trust who holds half of your recovery key. They never see your vault's contents, and cannot open it alone.",
  },
  // The half-sentence that makes the model legible in one read.
  howItWorks: {
    ar: "وثيقتك المطبوعة + نصيب الوصي = استعادة خزنتك. أيٌّ منهما وحده لا يكفي.",
    en: "Your printed sheet + your guardian's share = your vault back. Neither half is enough alone.",
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
  inviteMessage: {
    ar: "دعوتك لتكون وصياً على خزنة وصيّة. افتح التطبيق وأدخل هذا الرمز: {token}",
    en: "You've been asked to be a guardian for a Wassiya vault. Open the app and enter this code: {token}",
  },

  statusInvited: { ar: "بانتظار القبول", en: "Waiting to accept" },
  statusAccepted: { ar: "قبل الدعوة", en: "Accepted" },
  statusActive: { ar: "مفعّل", en: "Active" },
  statusRevoked: { ar: "مُلغى", en: "Revoked" },

  // Accepting publishes their key; sealing is the owner's own separate act,
  // because it needs the owner's biometric and their copy of S_guardian.
  sealTitle: { ar: "أرسل نصيب الوصي", en: "Send the guardian's share" },
  sealBody: {
    ar: "{name} قبل الدعوة ونشر مفتاحه. أرسل نصيبه الآن لتكتمل قدرتك على الاستعادة.",
    en: "{name} accepted and published their key. Send their share now to complete your ability to recover.",
  },
  seal: { ar: "أرسل النصيب", en: "Send the share" },
  sealing: { ar: "جارٍ الإرسال…", en: "Sending…" },
  sealDone: {
    ar: "اكتملت الاستعادة. وثيقتك المطبوعة تعمل الآن مع نصيب الوصي.",
    en: "Recovery is complete. Your printed sheet now works with your guardian's share.",
  },
  sealFailed: {
    ar: "تعذّر إرسال النصيب. لم يتغيّر شيء — حاول مرة أخرى.",
    en: "Could not send the share. Nothing changed — try again.",
  },
  sealKeyLost: {
    ar: "لم يعد هذا الجهاز يستطيع قراءة نصيب الوصي. تحتاج إلى ترقية الاسترداد من جهاز يحمل مفتاحك.",
    en: "This device can no longer read the guardian share. You'll need to reissue recovery from a device that holds your key.",
  },

  revoke: { ar: "ألغِ الوصي", en: "Remove guardian" },
  revokeTitle: { ar: "إلغاء الوصي؟", en: "Remove this guardian?" },
  revokeBody: {
    ar: "سيتوقف نصيبه عن العمل، وستحتاج إلى وصي بديل وإعادة إصدار وثيقة الاسترداد.",
    en: "Their share stops working, and you'll need a replacement guardian and a reissued recovery sheet.",
  },
  revokeConfirm: { ar: "ألغِ", en: "Remove" },
  cancel: { ar: "إلغاء", en: "Cancel" },

  emptyTitle: { ar: "لم تختر وصياً بعد", en: "No guardian yet" },
} satisfies LabelSet<string>

/** ٦.٢b — accepting an invitation, guardian side. */
export const GUARDIAN_ACCEPT = {
  title: { ar: "كن وصياً", en: "Become a guardian" },
  intro: {
    ar: "طُلب منك أن تكون وصياً. ستحتفظ بنصف مفتاح استرداد — لا ترى محتوى الخزنة، ولا تستطيع فتحها وحدك.",
    en: "You've been asked to be a guardian. You'll hold half of a recovery key — you never see the vault's contents, and cannot open it alone.",
  },
  responsibility: {
    ar: "ما يُطلب منك: أن تحتفظ بهذا الجهاز، وأن تؤكّد الطلب عندما يحتاج صاحب الخزنة إلى الاستعادة.",
    en: "What's asked of you: keep this device, and confirm the request when the vault's owner needs to recover.",
  },
  tokenLabel: { ar: "رمز الدعوة", en: "Invitation code" },
  tokenPlaceholder: { ar: "الصق الرمز الذي وصلك", en: "Paste the code you received" },
  accept: { ar: "اقبل وأنشئ مفتاحك", en: "Accept and create your key" },
  accepting: { ar: "جارٍ القبول…", en: "Accepting…" },
  // The biometric that seals their new secret key into this device.
  keyPrompt: {
    ar: "أثبت هويتك لإنشاء مفتاح الوصي على هذا الجهاز",
    en: "Confirm it's you to create your guardian key on this device",
  },
  acceptedTitle: { ar: "أصبحت وصياً", en: "You're a guardian" },
  acceptedBody: {
    ar: "مفتاحك محفوظ على هذا الجهاز خلف بصمتك. لا يغادره أبداً.",
    en: "Your key is stored on this device behind your fingerprint. It never leaves it.",
  },
  invalid: {
    ar: "رمز غير صالح أو منتهي. اطلب دعوة جديدة.",
    en: "That code is invalid or expired. Ask for a new invitation.",
  },
  failed: { ar: "تعذّر القبول. حاول مرة أخرى.", en: "Could not accept. Try again." },
  ownerSelf: {
    ar: "لا يمكنك أن تكون وصياً على خزنتك.",
    en: "You cannot be a guardian for your own vault.",
  },
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
 * and the board says why: *"it must reach a person who is alive, on their own
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

/**
 * ٧ — the guardian's side of a death claim.
 *
 * A guardian is asked for something twice, and both are dead ends without them:
 * confirming the claim, which starts the owner's 30-day objection window, and —
 * after release — handing the heir the half of the key only they can open.
 *
 * ## The tone here is not the veto screen's
 *
 * `CLAIM_VETO` speaks to someone who is alive and being asked to prove it, so it
 * is reassuring and slightly urgent. This speaks to someone who has probably
 * just been told a friend has died and is being asked to act on it. It is
 * plainer, slower, and it never implies the guardian is deciding whether the
 * death happened — they are confirming what they already know from outside the
 * app. Nothing here should read as an accusation of the claimant or as pressure
 * on the guardian.
 *
 * ## What it refuses to say
 *
 * There is no "reject" here, because the backend has none: a guardian who does
 * nothing lets the claim sit in `guardian_review` indefinitely, and that is the
 * correct behaviour — doubt should stall a claim, not kill it. Saying "decline"
 * would promise an action that does not exist.
 */
export const GUARDIAN_CLAIM = {
  title: { ar: "طلبات تنتظرك كوصي", en: "Claims waiting on you" },
  intro: {
    ar: "أنت وصيٌّ على خزائن. حين يصل طلب وراثة على إحداها ويجتاز المراجعة، يُطلب منك تأكيده — وأنت آخر إنسان يراه قبل أن تبدأ مهلة الاعتراض.",
    en: "You guard vaults for other people. When an inheritance claim on one of them passes review, you are asked to confirm it — the last person to see it before the objection window starts.",
  },
  empty: { ar: "لا شيء ينتظرك الآن", en: "Nothing is waiting on you" },

  relation: { ar: "أنت وصيّه — {relation}", en: "You are their guardian — {relation}" },
  claimant: { ar: "تقدّم بالطلب: {name}", en: "Filed by {name}" },
  certificate: { ar: "شهادة الوفاة: {name}", en: "Certificate: {name}" },
  certificateNone: { ar: "لم تصل شهادة", en: "No certificate" },

  // ── Confirming ───────────────────────────────────────────────────────────
  confirmTitle: { ar: "تأكيد الوفاة", en: "Confirm the death" },
  confirmBody: {
    ar: "بتأكيدك تبدأ مهلة اعتراض مدتها ٣٠ يوماً. خلالها يستطيع صاحب الخزنة إيقاف الطلب بنفسه — فإن كان حيّاً، سيوقفه. لا يُفرج عن شيء قبل انتهاء المهلة.",
    en: "Confirming starts a 30-day objection window. During it the vault's owner can stop the claim themselves — so if they are alive, they will. Nothing is released before it ends.",
  },
  confirm: { ar: "أؤكّد أنّه توفّي", en: "I confirm they have died" },
  confirming: { ar: "جارٍ التأكيد…", en: "Confirming…" },
  confirmPrompt: {
    ar: "أثبت هويتك لتأكيد الطلب",
    en: "Confirm it's you to confirm this claim",
  },
  confirmed: {
    ar: "أُكِّد الطلب. بدأت مهلة الاعتراض، وأُبلغ صاحب الخزنة.",
    en: "Confirmed. The objection window has started and the owner has been told.",
  },

  // Doing nothing is a legitimate choice, and the screen says so rather than
  // leaving a guardian to guess whether silence has consequences.
  unsureTitle: { ar: "إن لم تكن متأكّداً", en: "If you are not sure" },
  unsureBody: {
    ar: "لا تؤكّد. لا يمضي الطلب دون تأكيدك، ولا يترتّب على انتظارك شيء — تحقّق أولاً بالطريقة التي تراها.",
    en: "Do not confirm. The claim does not proceed without you, and waiting costs nothing — check first, however you see fit.",
  },

  notLinked: {
    ar: "لم يُربط هذا الطلب بوريث بعد. لا يمكن تأكيده قبل ذلك — سيتولّاه فريق المراجعة.",
    en: "This claim is not linked to an heir yet, so it cannot be confirmed. The review team handles that.",
  },

  biometricFailed: {
    ar: "لم يتم التحقق. التأكيد يحتاج بصمتك — وهذا ما يمنع شخصاً آخر من التأكيد نيابةً عنك.",
    en: "Not verified. Confirming needs your biometrics — which is what stops someone else confirming for you.",
  },
  failed: {
    ar: "تعذّر تأكيد الطلب. لم يتغيّر شيء — حاول مرة أخرى.",
    en: "Could not confirm the claim. Nothing changed — try again.",
  },

  // ── Handing over the share, after release ────────────────────────────────
  handoverTitle: { ar: "سلّم نصيبك للوارث", en: "Hand your share to the heir" },
  handoverBody: {
    ar: "انتهت المهلة وأُفرج عن الطلب. لا يستطيع الوارث فتح ما خُصّص له إلا بنصفَي المفتاح: نصف لديه، والنصف الآخر لا يفتحه إلا جهازك.",
    en: "The window ended and the claim released. The heir cannot open what was left to them without both halves of the key: they hold one, and only your device can open the other.",
  },
  handover: { ar: "افتح نصيبي", en: "Open my share" },
  handoverPrompt: {
    ar: "أثبت هويتك لفتح نصيبك",
    en: "Confirm it's you to open your share",
  },
  shareTitle: { ar: "نصيبك", en: "Your share" },
  // Before the share appears, never after — the same rule the recovery ceremony
  // states, and for the same reason: a warning read under the value it guards
  // is worth nothing.
  verifyFirst: {
    ar: "تأكّد أنّك تسلّمه لمن تعرف أنّه الوارث. من يملك هذا النصيب مع نصيب الوارث يفتح ما خُصّص له.",
    en: "Make sure you are handing this to someone you know to be the heir. Whoever holds this half together with theirs opens what was left to them.",
  },
  shareBody: {
    ar: "أعطِه للوارث بالطريقة التي تثق بها. لا يمرّ هذا النصيب عبر خوادمنا مفتوحاً، ولا نستطيع إرساله نيابةً عنك.",
    en: "Give it to the heir however you trust. This half never passes through our servers in the open, and we cannot send it for you.",
  },
  copy: { ar: "انسخ", en: "Copy" },
  copied: { ar: "نُسخ", en: "Copied" },
  done: { ar: "تم", en: "Done" },
  keyLost: {
    ar: "لم يعد هذا الجهاز يملك مفتاح الوصاية. إن تغيّرت بصمتك أو أُعيد ضبط الجهاز، فالمفتاح ذهب معه.",
    en: "This device no longer holds the guardian key. If your biometrics changed or the device was reset, the key went with it.",
  },
} satisfies LabelSet<string>

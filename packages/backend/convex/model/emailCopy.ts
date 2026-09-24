// Everything this deployment says to a human, in both languages.
//
// Separated from `email.ts` because the two have different reasons to change:
// that file is the delivery funnel — the Resend client, the language pick, the
// audit row, the link — and this one is the words. A wording change should not
// touch the mechanism, and a mechanism change should not put nine message
// bodies in the diff.
//
// It lives under `model/` rather than in an `email/` directory because that is
// this repo's established home for code under `convex/` that registers no
// functions (`claimFlow.ts`, `access.ts`, `jobRuns.ts`). A `convex/email/copy.ts`
// would be bundled and pushed as a function module holding zero functions.
//
// The voice is set in `apps/mobile` and `apps/web` and matched here: plain,
// warm, never euphemistic about death. A message that reads like a marketing
// send is one a worried person distrusts, and several of these are messages that
// have to be believed.

export type Copy = { subject: string; body: string }
export type LocalisedCopy = { ar: Copy; en: Copy }

/**
 * The escalation ladder, in the owner's own language.
 *
 * Copy lives on the deployment rather than in the app because the app is exactly
 * what the recipient is not looking at — that is the premise of the dead man's
 * switch.
 *
 * `countdown` is not merely louder: it is the step where the veto window is
 * running, so it says what will happen and by when.
 */
export const ESCALATION_COPY = {
  day0: {
    ar: {
      subject: "حان وقت تأكيد الحياة",
      body: "مرّ موعد تأكيدك. افتح وصيّة وأكّد ببصمتك — لا شيء يتحرّك قبل ذلك.",
    },
    en: {
      subject: "Your check-in is due",
      body: "Your check-in date has passed. Open Wassiya and confirm with your fingerprint — nothing moves before that.",
    },
  },
  day7: {
    ar: {
      subject: "أسبوع على موعد تأكيدك",
      body: "لم نسمع منك منذ أسبوع. افتح وصيّة وأكّد ببصمتك.",
    },
    en: {
      subject: "A week since your check-in was due",
      body: "We have not heard from you in a week. Open Wassiya and confirm with your fingerprint.",
    },
  },
  day14: {
    ar: {
      subject: "أسبوعان — لم نسمع منك",
      body: "لم نسمع منك منذ أسبوعين. افتح وصيّة وأكّد ببصمتك — إن لم تؤكّد، سنستمرّ في محاولة الوصول إليك.",
    },
    en: {
      subject: "Two weeks — we have not heard from you",
      body: "We have not heard from you in two weeks. Open Wassiya and confirm with your fingerprint — if you do not, we will keep trying to reach you.",
    },
  },
  countdown: {
    ar: {
      subject: "مهم: بدأت مهلة الاعتراض على خزنتك",
      body: "بدأت المهلة التي تسبق تسليم خزنتك إلى ورثتك. تأكيدك الآن يوقف ذلك فوراً.",
    },
    en: {
      subject: "Important: the veto window on your vault has started",
      body: "The window before your vault is handed to your heirs has begun. Confirming now stops it immediately.",
    },
  },
} as const satisfies Record<string, LocalisedCopy>

/**
 * Tell an owner their vault was opened with the printed sheet.
 *
 * This is the message that replaces a person. Recovery used to need the
 * guardian's half, so an illegitimate attempt had a second human in it who could
 * notice or refuse. K_rec is the sheet alone now, and the sheet is a bearer
 * token — whoever photographs it can recover the vault, silently. This notice is
 * what makes it not silent, which is why it is sent from the same transaction
 * that records the use rather than from a cron that might not run.
 *
 * It names no device and no location: an inbox is an intercepted surface, and
 * the recipient needs only "this happened, and here is what to do if it wasn't
 * you."
 */
/**
 * The settings page test. Not a notice anyone is waiting for — it exists so an
 * operator can tell a working sender from a typo before an escalation does it
 * for them.
 */
export const TEST_COPY = {
  ar: {
    subject: "وصيّة: رسالة اختبار",
    body: "هذه رسالة اختبار من لوحة الإدارة. وصولها يعني أن عنوان المُرسِل ومفتاح Resend يعملان.",
  },
  en: {
    subject: "Wassiya: test message",
    body: "This is a test message from the admin console. Receiving it means the sender address and the Resend key are both working.",
  },
} as const satisfies LocalisedCopy

export const RECOVERY_COPY = {
  ar: {
    subject: "مهم: فُتحت خزنتك باستخدام وثيقة الاسترداد",
    body: "استُخدمت وثيقة الاسترداد المطبوعة لفتح خزنتك على جهاز. إن لم تكن أنت، افتح وصيّة الآن: اطبع وثيقة جديدة — فالقديمة تبطل بذلك — وألغِ الأجهزة التي لا تعرفها.",
  },
  en: {
    subject: "Important: your vault was opened with your recovery sheet",
    body: "Your printed recovery sheet was used to open your vault on a device. If this wasn't you, open Wassiya now: print a new sheet — that voids the old one — and revoke any device you don't recognise.",
  },
} as const satisfies LocalisedCopy

// ── The claimant's side ──────────────────────────────────────────────────────
//
// Until these existed the heir received **nothing** across a claim's whole life:
// two in-app rows at the very end and no mail at all, while `apps/web` promised
// "we email you at each change". These are that promise.
//
// Three rules hold across all of them.
//
// **Never say why a review failed.** `claims.publicStatus` documents the
// reason: a claimant who learns the name match failed learns how to make it
// pass. `reviewFailed` gives a fixed, non-specific line and a way to reach a
// human — it is deliberately the least informative message here.
//
// **Name nothing about the vault.** Not what it holds, not how much, not who
// else receives. A claim email is an intercepted surface like any other.
//
// **Say when nothing is needed.** Most of a claim's life is waiting, and a
// message that does not say so invites someone in the worst week of their life
// to refresh a page daily. The objection period is the clearest case: thirty days
// where the correct action is none.

/** Filed. The receipt — and the first thing the product has ever sent a heir. */
export const CLAIM_FILED_COPY = {
  ar: {
    subject: "استلمنا بلاغك",
    body: "استلمنا بلاغك وبدأنا مراجعته. سنطلب منك إثبات هويتك وشهادة الوفاة إن لم تكن أرسلتهما بعد، ونراسلك عند كل تغيّر — لا حاجة لمتابعة الصفحة يومياً.",
  },
  en: {
    subject: "We have your report",
    body: "We have your report and review has started. We will ask for your identity check and the death certificate if you have not sent them yet, and we will email you at each change — there is no need to watch the page.",
  },
} as const satisfies LocalisedCopy

/**
 * Approved, and the objection period has started. `{date}` is the day it ends:
 * stating it converts an indefinite wait into a date on a calendar, and it is
 * what makes "nothing is needed from you" believable rather than dismissive.
 */
export const CLAIM_IN_REVIEW_COPY = {
  ar: {
    subject: "اكتملت المراجعة — بدأت مهلة الاعتراض",
    body: "اكتملت مراجعتنا للبلاغ، وبدأت مهلة اعتراض مدّتها ثلاثون يوماً يستطيع خلالها صاحب الخزنة إيقافه. لا شيء مطلوب منك. إن لم يحدث اعتراض حتى {date}، نتواصل بأنفسنا مع الورثة الذين سمّاهم.",
  },
  en: {
    subject: "Review complete — the objection period has started",
    body: "We have finished reviewing the report, and a thirty-day objection period has begun in which the vault owner can stop it. Nothing is needed from you. If no objection comes by {date}, we contact the heirs the owner named ourselves.",
  },
} as const satisfies LocalisedCopy

/**
 * Closed at review.
 *
 * ⚠️ Says no reason, on purpose. See the block comment above: the name-match
 * verdict is exactly the thing a bad-faith claimant would iterate against.
 */
export const CLAIM_REVIEW_FAILED_COPY = {
  ar: {
    subject: "أُغلق بلاغك",
    body: "لم نتمكّن من متابعة هذا البلاغ بعد المراجعة، وقد أُغلق. إن كنت ترى أن هذا خطأ، تواصل معنا وسنراجعه بأنفسنا.",
  },
  en: {
    subject: "Your report is closed",
    body: "We were not able to take this report further after review, and it is now closed. If you believe that is wrong, contact us and a person will look at it.",
  },
} as const satisfies LocalisedCopy

/**
 * The owner objected.
 *
 * Names no reason because there is none to name: a veto is an assertion that
 * the owner is alive, made with a fingerprint on their own phone, and it
 * carries no explanation. The 90-day bar is stated because discovering it by
 * being refused would be worse.
 */
export const CLAIM_VETOED_COPY = {
  ar: {
    subject: "أُوقف بلاغك",
    body: "اعترض صاحب الخزنة على هذا البلاغ وأكّد أنه على قيد الحياة، فأُغلق البلاغ ولن يُسلَّم شيء. لا يمكن تقديم بلاغ جديد على هذه الخزنة لمدّة تسعين يوماً.",
  },
  en: {
    subject: "Your report has been stopped",
    body: "The vault owner objected to this report and confirmed they are alive, so it is closed and nothing will be handed over. A new report cannot be filed on this vault for ninety days.",
  },
} as const satisfies LocalisedCopy

/**
 * Released. Sent to the reporter, who receives nothing by reporting: each heir
 * the owner named is contacted directly and proves their own identity. Saying
 * so stops a reporter who is also an heir from waiting on this message.
 */
export const CLAIM_RELEASED_COPY = {
  ar: {
    subject: "انتهت مهلة الاعتراض",
    body: "انتهت مهلة الاعتراض دون اعتراض. نتواصل الآن مباشرةً مع كل وارث سمّاه صاحب الخزنة، على الرقم الذي سجّله، ليُثبت هويته ويستلم ما تُرك له. إن كنت أحدهم، ستصلك رسالة منفصلة.",
  },
  en: {
    subject: "The objection period has ended",
    body: "The objection period ended with no objection. We are now contacting each heir the vault owner named, on the number they registered, to prove their identity and receive what was left to them. If you are one of them, you will get a separate message.",
  },
} as const satisfies LocalisedCopy

/**
 * No vault matched, and nobody could link one.
 *
 * ⚠️ The one message in this set that tells a reader something about a vault's
 * existence — see `sweepUnmatched` for why that trade is worth making and why
 * the delay in front of it is load-bearing.
 *
 * It leads with the likely cause rather than the verdict. A mistyped address is
 * far commoner than a deceased person who never used Wassiya, and someone who
 * reads "no vault" as final stops looking for the right address.
 */
export const CLAIM_CLOSED_COPY = {
  ar: {
    subject: "لم نتمكّن من بدء إجراء على هذا البريد",
    body: "لم نجد خزنة مرتبطة بالبريد الذي أدخلته، فأُغلق بلاغك. غالباً ما يكون السبب خطأً في كتابة البريد — تحقّق منه وقدّم بلاغاً جديداً. لا يوجد أي قيد على تقديم بلاغ آخر.",
  },
  en: {
    subject: "We could not start a process from that address",
    body: "We found no vault for the address you entered, so your report is closed. The commonest reason is a typo in the address — check it and file again. There is no restriction on filing another.",
  },
} as const satisfies LocalisedCopy

/**
 * The heir's identity matched and the delivery can be opened. Names no one and
 * nothing: the link leads to a page that asks them to sign in first.
 */
export const DELIVERY_READY_COPY = {
  ar: {
    subject: "ما تُرك لك جاهز للفتح",
    body: "تحقّقنا من هويتك، وأصبح ما تُرك لك جاهزاً. يُفتح على جهازك فقط، ويبقى متاحاً حتى {date} — نزّل ما تحتاجه قبل ذلك.",
  },
  en: {
    subject: "What was left to you is ready to open",
    body: "We have verified your identity and what was left to you is ready. It opens on your device only and stays available until {date} — download what you need before then.",
  },
} as const satisfies LocalisedCopy

/**
 * Thirty days before a delivery's key is destroyed. `{date}` is the day it
 * closes: after it, nobody can open the delivery again, Wassiya included.
 */
export const DELIVERY_EXPIRING_COPY = {
  ar: {
    subject: "يُغلق ما تُرك لك بعد ثلاثين يوماً",
    body: "في {date} يُتلف مفتاح ما تُرك لك نهائياً، ولا يستطيع أحد فتحه بعد ذلك — ولا نحن. إن لم تكن نزّلت ما تحتاجه، افتحه الآن.",
  },
  en: {
    subject: "What was left to you closes in thirty days",
    body: "On {date} the key to what was left to you is destroyed for good, and nobody can open it after that — us included. If you have not downloaded what you need, open it now.",
  },
} as const satisfies LocalisedCopy

/**
 * The link to an heir. Names no one and nothing: a phone number or address can
 * be recycled, and whoever reads this may not be the heir. Everything after
 * the link asks for sign-in and identity first.
 */
export const DELIVERY_INVITE_COPY = {
  ar: {
    subject: "تُرك لك شيء لدى وصيّة",
    body: "تُرك لك شيء لدى وصيّة. افتح الرابط وأثبت هويتك لتستلمه. إن لم تكن تعرف سبب هذه الرسالة، تجاهلها — لا يُفتح شيء دون التحقّق من الهوية.",
  },
  en: {
    subject: "Something was left for you at Wassiya",
    body: "Something was left for you at Wassiya. Open the link and verify your identity to receive it. If this message means nothing to you, ignore it — nothing opens without an identity check.",
  },
} as const satisfies LocalisedCopy

/**
 * The staff invitation.
 *
 * It names no roles and no account. An invitation goes to an address before
 * anybody has proved they hold it, so the message is the one place in this file
 * that must assume a stranger is reading — what the roles are is on the screen,
 * behind a sign-in.
 */
export const STAFF_INVITE_COPY = {
  ar: {
    subject: "دعوة للانضمام إلى لوحة وصيّة",
    body: "دُعيت للعمل على لوحة تحكّم وصيّة. افتح الرابط وسجّل الدخول بالبريد نفسه الذي وصلتك عليه هذه الرسالة. تنتهي الدعوة خلال أسبوعين. إن لم تكن تتوقّع هذه الرسالة، تجاهلها — لا يُمنح شيء قبل تسجيل الدخول.",
  },
  en: {
    subject: "You have been invited to the Wassiya console",
    body: "You have been invited to work on the Wassiya console. Open the link and sign in with the same address this message reached. The invitation expires in two weeks. If you were not expecting this, ignore it — nothing is granted until you sign in.",
  },
} as const satisfies LocalisedCopy

/**
 * Staff answered a support thread and it is still unread. Never carries the
 * reply itself: an inbox is an intercepted surface, and the thread may hold
 * details of an account or a case.
 */
export const SUPPORT_REPLY_COPY = {
  ar: {
    subject: "وصلك ردّ من فريق وصيّة",
    body: "ردّ فريق الدعم على رسالتك. افتح المحادثة لقراءته — على تطبيق وصيّة من الإعدادات ← المساعدة، أو من الرابط أدناه إن وُجد. لن نطلب منك أبداً وثيقة الاسترداد أو رموزها.",
  },
  en: {
    subject: "Wassiya support has replied",
    body: "Our support team replied to your message. Open the conversation to read it — in the Wassiya app under Settings → Help, or from the link below if there is one. We will never ask for your recovery sheet or its code.",
  },
} as const satisfies LocalisedCopy

/** The lock-screen notice for the same event. Title and body only, no content. */
export const SUPPORT_REPLY_PUSH = {
  ar: { subject: "وصيّة", body: "ردّ فريق الدعم على رسالتك." },
  en: { subject: "Wassiya", body: "Support replied to your message." },
} as const satisfies LocalisedCopy

/**
 * The same, to a guest with no account. The link carries a single-use key that
 * reopens the conversation in whichever browser follows it.
 */
export const SUPPORT_REPLY_GUEST_COPY = {
  ar: {
    subject: "وصلك ردّ من فريق وصيّة",
    body: "ردّ فريق الدعم على رسالتك. افتح الرابط أدناه لقراءة الردّ ومتابعة المحادثة — يعمل الرابط مرة واحدة. إن لم تكن راسلتنا، تجاهل هذه الرسالة.",
  },
  en: {
    subject: "Wassiya support has replied",
    body: "Our support team replied to your message. Open the link below to read it and carry on the conversation — the link works once. If you did not write to us, ignore this message.",
  },
} as const satisfies LocalisedCopy

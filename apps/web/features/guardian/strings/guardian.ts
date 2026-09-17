import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The guardian's invitation and key ceremony, built around one line:
 *
 * *"It was never sent to us, we hold no copy, and we cannot issue it again —
 * because if we could, we could open the heirs' boxes on our own."*
 *
 * Said that way the inability *is* the guarantee rather than an apology, which
 * is why the screen can ask someone to keep a piece of paper for a decade
 * without sounding negligent.
 *
 * Olive, not terracotta. Olive already means settled and safe in this product,
 * and a guardian is not being asked to act urgently — terracotta would make an
 * invitation look like an alarm.
 *
 * No sign-in copy: the app sits entirely behind the wall, so a reader here is
 * authenticated by construction and the invitation link bounces through
 * `/sign-in` back onto the token it was carrying.
 */
export const GUARDIAN = {
  eyebrow: { ar: "دعوة وصي", en: "Guardian invitation" },
  /**
   * Stands in for the owner's name.
   *
   * The board writes "فاطمة اختارتك" — but naming them before acceptance would
   * need a public query keyed on the invite token, which is a lookup oracle for
   * anyone guessing tokens. The invitation email carries the name; this page
   * does not need it to explain the role.
   */
  someone: { ar: "أحدهم", en: "Someone" },
  titleOne: { ar: "{name} اختارك وصيّاً.", en: "{name} chose you as guardian." },
  titleTwo: {
    ar: "تحفظ نصف مفتاح، لا سرّاً.",
    en: "You hold half a key, not a secret.",
  },
  lede: {
    ar: "سيُطلب منك شيء مرّتين على الأكثر، وقد يمرّ عليهما سنوات: أن تؤكّد الوفاة إن حدثت، وأن تسلّم نصف مفتاحك للورثة.",
    en: "You'll be asked to act twice at most, possibly years apart: confirm the death if it happens, and hand your key half to the heirs.",
  },

  willTitle: { ar: "ما ستفعله", en: "what you will do" },
  willConfirm: { ar: "تؤكّد الوفاة", en: "Confirm the death" },
  willConfirmBody: {
    ar: "بعد أن يتحقّق وارث من هويته، ويرفع شهادة رسمية، وتمضي مدة الاعتراض — تأكيدك هو الخطوة الأخيرة.",
    en: "After an heir verifies their identity, uploads an official certificate and the objection period passes — your confirmation is the last step.",
  },
  willHandover: { ar: "تسلّم نصف مفتاحك", en: "Hand over your key half" },
  willHandoverBody: {
    ar: "صندوق كل وارث لا يُفتح إلا بنصفنا ونصفك معاً. ضغطة واحدة من صفحتك.",
    en: "Each heir's box needs our half and yours together. One tap from your page.",
  },

  neverTitle: { ar: "ما لن يُطلب منك أبداً", en: "what you will never be asked" },
  neverSee: {
    ar: "أن ترى ما في الخزنة — لا اليوم ولا بعد التسليم",
    en: "To see inside the vault — not today, not after release",
  },
  neverDivide: {
    ar: "أن تقسّم تركة أو تفصل بين ورثة",
    en: "To divide an estate or arbitrate between heirs",
  },
  neverPay: {
    ar: "أن تدفع شيئاً أو تتحمّل مسؤولية قانونية",
    en: "To pay anything or take on legal liability",
  },
  neverStart: {
    ar: "أن تبدأ إفراجاً — نصفك وحده لا يفتح شيئاً",
    en: "To start a release — your half alone opens nothing",
  },

  accept: { ar: "أقبل — أنشئ مفتاحي", en: "Accept — create my key" },
  decline: { ar: "أعتذر", en: "Decline" },
  expiryNote: {
    ar: "الاعتذار اليوم أفضل من قبول لا نجدك بعده.",
    en: "Declining today beats accepting and being unfindable later.",
  },

  // ---- the key sheet ------------------------------------------------------
  createdNow: {
    ar: "أُنشئ على هذا الجهاز قبل ثوانٍ",
    en: "Created on this device seconds ago",
  },
  keyTitleOne: { ar: "هذا مفتاحك.", en: "This is your key." },
  keyTitleTwo: { ar: "احفظه الآن.", en: "Save it now." },
  keyLede: {
    ar: "لم يُرسل إلينا، ولا نحفظ نسخة منه، ولا نستطيع إصداره لك مرة أخرى — لأننا لو استطعنا، لاستطعنا فتح صناديق الورثة وحدنا.",
    en: "It was never sent to us, we hold no copy, and we cannot issue it again — because if we could, we could open the heirs' boxes on our own.",
  },
  // The sheet's own labels live with the sheet — see `strings/key-sheet.ts`.
  // They were here, and were about to be copied into the duties dictionary
  // so the key page could render the same block.

  // ---- confirm ------------------------------------------------------------
  confirmTitle: { ar: "اكتبه مرة واحدة", en: "Type it back once" },
  confirmBody: {
    ar: "لنتأكّد أنك حفظته فعلاً قبل أن نُنهي الدعوة. لن نطلبه منك بعد ذلك.",
    en: "So we know you really saved it before the invitation is spent. We won't ask for it again.",
  },
  confirmLabel: { ar: "المفتاح كما حفظته", en: "The key as you saved it" },
  confirmAction: { ar: "أكّد واقبل الوصاية", en: "Confirm and accept" },
  confirmBusy: { ar: "جارٍ القبول…", en: "Accepting…" },
  confirmMismatch: {
    ar: "لا يطابق ما أُنشئ. تحقّق من الحروف — لا نستطيع تصحيحه لك.",
    en: "That doesn't match what was created. Check the characters — we can't correct it for you.",
  },
  confirmFailed: {
    ar: "تعذّر إنهاء القبول. قد تكون الدعوة انتهت أو استُخدمت.",
    en: "We couldn't finish accepting. The invitation may have expired or been used.",
  },

  doneTitle: { ar: "أنت الآن وصي.", en: "You are now a guardian." },
  doneBody: {
    ar: "لا شيء مطلوب منك حتى نطلبه. سنراسلك على بريدك، ولن يكون ذلك قريباً على الأرجح.",
    en: "Nothing is required of you until we ask. We'll email you, and most likely not soon.",
  },
  doneAction: { ar: "افتح لوحتك", en: "Open your dashboard" },

  noToken: {
    ar: "هذا الرابط غير مكتمل. افتح الرابط الكامل الذي وصلك في الدعوة.",
    en: "This link is incomplete. Open the full link from your invitation.",
  },
} as const satisfies Dictionary

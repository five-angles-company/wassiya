import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The guardian's working screens: the duties list, the confirmation, the
 * handover and the key page.
 *
 * ## Olive, not terracotta
 *
 * The guardian's whole surface is olive. In this product olive already means
 * settled and safe — it is the colour of a completed step and a released box —
 * and a guardian is not being asked to act urgently. Terracotta would make a
 * duty look like an alarm, on a screen whose reader may not have opened this
 * app in five years.
 *
 * ## The two duties are never merged
 *
 * `confirm` starts a 30-day veto window; `handover` gives an heir half a key.
 * They read as one list because a guardian arrives not knowing which they are
 * here for, but the confirmation copy for each is written separately: one is a
 * statement about a death, the other is a transfer of custody.
 */
export const GUARDIAN_DUTIES = {
  title: { ar: "ما هو مطلوب منك", en: "What needs you" },
  body: {
    ar: "يُطلب منك شيء مرّتين على الأكثر في عمر الوصاية. كل ما يخصّك الآن هنا.",
    en: "You are asked to act twice at most in the whole life of a guardianship. Everything that concerns you now is here.",
  },

  nothingTitle: { ar: "لا شيء مطلوب منك", en: "Nothing needs you" },
  nothingBody: {
    ar: "هذا هو الوضع الطبيعي، وقد يدوم سنوات. سنراسلك على بريدك حين يتغيّر.",
    en: "That is the normal state, and it may last years. We'll email you when it changes.",
  },

  vaultsTitle: { ar: "الخزائن التي توصي عليها", en: "The vaults you guard" },
  vaultsEmpty: {
    ar: "لا توجد وصاية على حسابك بعد. تُفتح الوصاية من رابط الدعوة وحده.",
    en: "There is no guardianship on your account yet. A guardianship starts from an invitation link and nothing else.",
  },
  relation: { ar: "الصلة", en: "Relation" },

  // ---- the duty rows -----------------------------------------------------
  dutyConfirmTitle: { ar: "تأكيد وفاة {name}", en: "Confirm {name}'s death" },
  dutyConfirmBody: {
    ar: "تحقّق وارث من هويته ورفع شهادة رسمية. تأكيدك يبدأ مدة اعتراض مدتها ثلاثون يوماً — لا يسلّم شيئاً اليوم.",
    en: "An heir has verified their identity and uploaded an official certificate. Your confirmation starts a thirty-day objection period — it delivers nothing today.",
  },
  dutyHandoverTitle: {
    ar: "سلّم نصف مفتاحك — خزنة {name}",
    en: "Hand over your key half — {name}'s vault",
  },
  dutyHandoverBody: {
    ar: "انتهت المدة وصار الصندوق جاهزاً. لا يُفتح إلا بنصفنا ونصفك معاً.",
    en: "The period has ended and the box is ready. It opens only with our half and yours together.",
  },
  review: { ar: "راجع", en: "Review" },

  claimantIs: { ar: "قدّمه", en: "Filed by" },
  certificateFor: { ar: "الشهادة باسم", en: "Certificate names" },
  nameMatchPending: {
    ar: "مطابقة الاسم قيد المراجعة لدينا",
    en: "The name match is still with our reviewers",
  },
  nameMatchFailed: {
    ar: "لم يطابق الاسم المسجّل. البلاغ عند مراجع بشري ولا يُطلب منك شيء الآن.",
    en: "The name did not match our record. The report is with a human reviewer and nothing is asked of you now.",
  },

  // `guardianConfirm` throws on a claim with no heir linked, so the screen says
  // so instead of offering a button that fails.
  notLinkedTitle: { ar: "لم يُربط الوارث بعد", en: "The heir is not linked yet" },
  notLinkedBody: {
    ar: "نربط الوارث بالبلاغ يدوياً قبل أن نطلب تأكيدك. لا شيء مطلوب منك حتى ذلك.",
    en: "We link the heir to the report by hand before asking you to confirm. Nothing is needed from you until then.",
  },

  // ---- confirming --------------------------------------------------------
  confirmTitle: { ar: "هل تؤكّد الوفاة؟", en: "Do you confirm the death?" },
  confirmBody: {
    ar: "أنت تؤكّد ما تعرفه أنت، لا ما في الأوراق. إن كنت غير متأكّد، لا تؤكّد — يمكن أن ينتظر البلاغ.",
    en: "You are confirming what you know, not what the paperwork says. If you are not sure, don't confirm — the report can wait.",
  },
  confirmWhatHappens: {
    ar: "بعد تأكيدك تبدأ مدة اعتراض مدتها ثلاثون يوماً. إن كان صاحب الخزنة حيّاً، يستطيع خلالها أن يوقف كل شيء.",
    en: "After you confirm, a thirty-day objection period begins. If the vault's owner is alive, they can stop everything within it.",
  },
  confirmAction: { ar: "أؤكّد الوفاة", en: "I confirm the death" },
  confirmBusy: { ar: "جارٍ التأكيد…", en: "Confirming…" },
  confirmDone: {
    ar: "سُجّل تأكيدك. بدأت مدة الاعتراض، وسنراسلك عند انتهائها.",
    en: "Your confirmation is recorded. The objection period has begun, and we'll email you when it ends.",
  },
  confirmFailed: {
    ar: "تعذّر تسجيل التأكيد. قد يكون البلاغ تغيّر — أعد تحميل الصفحة.",
    en: "We could not record the confirmation. The report may have changed — reload the page.",
  },

  // ---- handover ----------------------------------------------------------
  handoverTitle: { ar: "نصف المفتاح للوارث", en: "The key half for the heir" },
  handoverBody: {
    ar: "أدخل مفتاحك المطبوع. نفكّ به نصيب هذا الوارث على جهازك، فيظهر لك نصّ تسلّمه له بنفسك — مكالمة أو رسالة، لا من خلالنا.",
    en: "Enter your printed key. We use it on your device to unwrap this heir's half, and show you a code you hand over yourself — a call or a message, not through us.",
  },
  handoverKeyLabel: { ar: "مفتاحك المطبوع", en: "Your printed key" },
  handoverAction: { ar: "افتح نصيب الوارث", en: "Unwrap the heir's half" },
  handoverBusy: { ar: "جارٍ الفتح…", en: "Unwrapping…" },
  handoverResultTitle: {
    ar: "سلّم هذا للوارث",
    en: "Hand this to the heir",
  },
  handoverResultBody: {
    ar: "هذا نصيبه هو وحده — لا يفتح صندوق أي وارث آخر. أعطه إياه مباشرة، وتأكّد أنك تكلّم الشخص الصحيح.",
    en: "This is their half and no one else's — it opens no other heir's box. Give it to them directly, and make sure you are speaking to the right person.",
  },
  handoverKeyBad: {
    ar: "لا يطابق هذا المفتاح ما سُجّل لهذه الخزنة. تحقّق من الحروف — لا نستطيع تصحيحه لك.",
    en: "That key does not match the one registered for this vault. Check the characters — we cannot correct it for you.",
  },
  handoverFailed: {
    ar: "تعذّر فتح نصيب الوارث. أعد تحميل الصفحة وحاول مرة أخرى.",
    en: "We could not unwrap the heir's half. Reload the page and try again.",
  },
  handoverWarn: {
    ar: "لا ترسله في مجموعة، ولا تنشره. من يملك النصفين يفتح الصندوق.",
    en: "Don't send it to a group and don't post it. Whoever holds both halves opens the box.",
  },

  // ---- the key page ------------------------------------------------------
  keyTitle: { ar: "مفتاحي", en: "My key" },
  keyBody: {
    ar: "أُنشئ مفتاحك على جهازك يوم قبلت الوصاية، ولم يصل إلينا. لا نحفظ نسخة منه ولا نستطيع إصداره لك مرة أخرى — لأننا لو استطعنا، لاستطعنا فتح صناديق الورثة وحدنا.",
    en: "Your key was created on your device the day you accepted, and never reached us. We hold no copy and cannot issue it again — because if we could, we could open the heirs' boxes on our own.",
  },
  keyCheckTitle: { ar: "تحقّق من ورقتك", en: "Check your sheet" },
  keyCheckBody: {
    ar: "اكتب المفتاح كما هو على ورقتك. نقارنه بالمفتاح العام المسجّل لهذه الخزنة — على جهازك، دون أن يغادر المفتاح المتصفّح.",
    en: "Type the key exactly as it reads on your sheet. We compare it against the public key registered for this vault — on your device, without the key leaving the browser.",
  },
  keyCheckAction: { ar: "تحقّق", en: "Check" },
  keyCheckOk: {
    ar: "ورقتك سليمة. هذا هو المفتاح الذي تُغلق عليه صناديق ورثة هذه الخزنة.",
    en: "Your sheet is good. This is the key the heirs' boxes for this vault are sealed to.",
  },
  keyCheckBad: {
    ar: "لا يطابق. تحقّق من الحروف قبل أن تفترض أن الورقة ضاعت — الخطأ في النسخ أكثر شيوعاً.",
    en: "It doesn't match. Check the characters before assuming the sheet is lost — a transcription slip is far commoner.",
  },
  keyNoPublished: {
    ar: "لم يُسجَّل مفتاح عام لهذه الوصاية، فلا شيء نقارن به.",
    en: "No public key was registered for this guardianship, so there is nothing to compare against.",
  },
  keyLostTitle: { ar: "إن ضاعت الورقة", en: "If the sheet is lost" },
  keyLostBody: {
    ar: "أبلغ صاحب الخزنة ليعيد تعيينك. سيُنشئ جهازك مفتاحاً جديداً، ويُعاد ختم نصيب كل وارث عليه. لا يمكن استرجاع القديم.",
    en: "Tell the vault's owner so they can re-appoint you. Your device will create a new key and every heir's half is re-sealed to it. The old one cannot be recovered.",
  },
  keyForVault: { ar: "خزنة {name}", en: "{name}'s vault" },
} as const satisfies Dictionary

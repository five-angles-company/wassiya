import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The app's front door, once you are through the sign-in wall.
 *
 * It answers one question and refuses to answer it in the abstract: **is
 * anything waiting for me?** Two people share this screen and neither of them
 * opened it to browse — an heir is checking a report has not stalled, a
 * guardian was emailed that something needs them. So the top of the page is a
 * list of things to do, and when that list is empty it says so in words rather
 * than rendering an empty container.
 *
 * The fourth state is the one most products forget: **neither**. A person who
 * signs in with no report and no guardianship is not broken and not lost —
 * they are almost always someone who has just been emailed an invitation link
 * and clicked the wrong thing, or someone about to file. They get two doors and
 * no dashboard.
 */
export const HOME = {
  greeting: { ar: "أهلاً، {name}", en: "Hello, {name}" },
  greetingAnonymous: { ar: "أهلاً بك", en: "Hello" },


  // The list, shown only to somebody with more than one thing in flight. With
  // exactly one, `/` goes straight into it — see `case-router.tsx`.
  listBody: {
    ar: "كل ما هو جارٍ الآن. نراسلك على بريدك عند كل تغيّر — لا حاجة لمتابعة هذه الصفحة.",
    en: "Everything in flight. We email you at each change — there is no need to watch this page.",
  },
  caseTitle: { ar: "خزنة {name}", en: "{name}'s vault" },
  caseUnknownVault: { ar: "خزنة", en: "A vault" },
  nothingTitle: { ar: "لا شيء مطلوب منك", en: "Nothing needs you" },
  nothingBody: {
    ar: "سنراسلك على بريدك عند أي تغيّر. لا حاجة لفتح هذه الصفحة يومياً.",
    en: "We'll email you at any change. There's no need to open this page daily.",
  },

  // The two-door state.
  chooseBody: {
    ar: "حسابك جاهز ولا يوجد عليه شيء بعد. هذان البابان الوحيدان من هنا.",
    en: "Your account is ready and there's nothing on it yet. These are the only two doors from here.",
  },
  doorClaimTitle: { ar: "فقدت شخصاً عزيزاً", en: "I have lost someone" },
  doorClaimBody: {
    ar: "إن كان يحفظ إرثه الرقمي في وصيّة، تبدأ من بلاغ وفاة. نحو عشر دقائق، ويمكنك التوقّف والعودة.",
    en: "If they kept their digital legacy in Wassiya, you start with a death report. About ten minutes, and you can stop and come back.",
  },
  doorClaimAction: { ar: "أبلغ عن وفاة", en: "Report a death" },
  doorClaimMeta: {
    ar: "نحو عشر دقائق · يمكنك التوقّف والعودة",
    en: "About ten minutes · you can stop and come back",
  },
  doorGuardianTitle: {
    ar: "وصلتني دعوة وصاية",
    en: "I was invited as a guardian",
  },
  doorGuardianBody: {
    ar: "افتح الرابط الكامل من بريد الدعوة. لا نستطيع فتح الوصاية لك من هنا — الدعوة نفسها هي ما يثبت أنك المقصود.",
    en: "Open the full link from your invitation email. We can't start a guardianship for you from here — the invitation itself is what proves it was meant for you.",
  },
  doorGuardianMeta: {
    ar: "ابحث عن بريد باسم وصيّة",
    en: "Look for an email from Wassiya",
  },

  // The owner, who has arrived at the wrong app. Said plainly, because the
  // reason is the product's own promise rather than a missing feature.
  ownerTitle: { ar: "خزنتك على جوّالك", en: "Your vault lives on your phone" },
  ownerBody: {
    ar: "لا تُفتح الخزنة من المتصفّح ولا نحفظ مفتاحها لدينا. هذا الموقع للورثة والأوصياء فقط.",
    en: "A vault can't be opened in a browser and we don't hold its key. This site is for heirs and guardians only.",
  },

  // The doors: a place to go with a count on it. The figure carries the
  // weight, so the label and the unit are separate — "٢" and "بلاغ" are set at
  // different sizes and cannot come from one interpolated string.


  // The asks, phrased as asks. Each carries a sentence about what happens if
  // the reader acts — without one the card was a title alone in a wide box,
  // which is what made the old row look empty rather than calm.
  dutyConfirm: { ar: "تأكيد وفاة {name}", en: "Confirm {name}'s death" },
  dutyConfirmBody: {
    ar: "تحقّق وارث من هويته ورفع شهادة رسمية. تأكيدك يبدأ مدة اعتراض من ثلاثين يوماً — ولا يسلّم شيئاً اليوم.",
    en: "An heir has verified their identity and uploaded an official certificate. Your confirmation starts a thirty-day objection period — it delivers nothing today.",
  },
  dutyHandover: {
    ar: "تسليم نصف مفتاحك — خزنة {name}",
    en: "Hand over your key half — {name}'s vault",
  },
  dutyHandoverBody: {
    ar: "انتهت المدة وصار الصندوق جاهزاً. لا يُفتح إلا بنصفنا ونصفك معاً.",
    en: "The period has ended and the box is ready. It opens only with our half and yours together.",
  },
  dutyBlockedBody: {
    ar: "نربط الوارث بالبلاغ يدوياً قبل أن نطلب تأكيدك. لا شيء مطلوب منك حتى ذلك.",
    en: "We link the heir to the report by hand before asking you to confirm. Nothing is needed from you until then.",
  },
  review: { ar: "راجع", en: "Review" },
  open: { ar: "افتح الصندوق", en: "Open the box" },
} as const satisfies Dictionary

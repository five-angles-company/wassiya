import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The app's front door, once you are through the sign-in wall.
 *
 * It answers one question: **is anything waiting for me?** Two people share
 * this screen — someone who reported a death, and an heir we contacted. A
 * person with neither gets two doors and no dashboard.
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
  doorHeirTitle: {
    ar: "تواصلت معي وصيّة بخصوص إرث",
    en: "Wassiya contacted me about an inheritance",
  },
  doorHeirBody: {
    ar: "افتح الرابط من الرسالة التي وصلتك على جوّالك. الرابط هو ما يربط الإرث بك، ثم نتحقّق من هويتك قبل أن يُفتح شيء.",
    en: "Open the link from the message we sent to your phone. The link is what ties the inheritance to you, and we verify your identity before anything opens.",
  },
  doorHeirMeta: {
    ar: "ابحث عن رسالة باسم وصيّة",
    en: "Look for a message from Wassiya",
  },

  // The owner, who has arrived at the wrong app. Said plainly, because the
  // reason is the product's own promise rather than a missing feature.
  ownerTitle: { ar: "خزنتك على جوّالك", en: "Your vault lives on your phone" },
  ownerBody: {
    ar: "لا تُفتح الخزنة من المتصفّح ولا نحفظ مفتاحها لدينا. هذا الموقع لمن يبلّغ عن وفاة وللورثة فقط.",
    en: "A vault can't be opened in a browser and we don't hold its key. This site is only for reporting a death and for heirs.",
  },

  deliveryTitle: { ar: "ما تركه لك {name}", en: "What {name} left you" },
  deliveryUnknown: { ar: "إرث", en: "An inheritance" },
  deliveryIdentity: {
    ar: "أثبت هويتك ليُفتح",
    en: "Verify your identity to open it",
  },
  deliveryChecking: {
    ar: "نراجع هويتك — نراسلك حين يجهز",
    en: "We are checking your identity — we will email you",
  },
  deliveryReady: { ar: "جاهز للفتح", en: "Ready to open" },
  deliveryClosed: { ar: "لم يعد متاحاً", en: "No longer available" },
} as const satisfies Dictionary

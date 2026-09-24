import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The signed-in front door. It answers one question — is anything waiting for
 * me? — for two people: someone who reported a death, and an heir we contacted.
 * Someone with neither gets two doors and no dashboard.
 */
export const HOME = {
  greeting: { ar: "أهلاً، {name}", en: "Hello, {name}" },
  greetingAnonymous: { ar: "أهلاً بك", en: "Hello" },

  // Shown only to someone with more than one thing in flight; with exactly one,
  // `/` goes straight into it (`case-router.tsx`).
  listBody: {
    ar: "كل ما يخصّك هنا. نراسلك عند كل تغيير، فلا حاجة لمتابعة هذه الصفحة.",
    en: "Everything that's yours is here. We email you whenever something changes, so there's no need to keep checking.",
  },
  listTitle: { ar: "ما لديك", en: "What you have" },
  caseTitle: { ar: "بلاغ عن {name}", en: "Report about {name}" },
  caseUnknownVault: { ar: "صاحب خزنة", en: "a vault owner" },

  chooseBody: {
    ar: "حسابك جاهز. ابدأ بما جئت من أجله:",
    en: "Your account is ready. Start with what you came for:",
  },
  doorClaimTitle: { ar: "فقدت شخصاً عزيزاً", en: "I've lost someone" },
  doorClaimBody: {
    ar: "إن كان يستخدم وصيّة، ابدأ بالإبلاغ عن وفاته. لن تحصل على شيء بتقديم البلاغ — نحن نتواصل مع ورثته مباشرة.",
    en: "If they used Wassiya, start by reporting their death. Reporting doesn't give you anything — we contact their heirs directly.",
  },
  doorClaimAction: { ar: "أبلغ عن وفاة", en: "Report a death" },
  doorClaimMeta: {
    ar: "نحو عشر دقائق، ويمكنك الإكمال لاحقاً",
    en: "About ten minutes, and you can finish later",
  },
  doorHeirTitle: { ar: "وصلتني رسالة من وصيّة", en: "I got a message from Wassiya" },
  doorHeirBody: {
    ar: "افتح الرابط الموجود في الرسالة التي وصلتك. الرابط هو ما يربط الإرث بك، ثم نتأكد من هويتك قبل أن يُفتح شيء.",
    en: "Open the link in the message you received. The link is what ties the inheritance to you, and we confirm who you are before anything opens.",
  },
  doorHeirMeta: { ar: "ابحث عن رسالة باسم وصيّة", en: "Look for a message from Wassiya" },
  doorHeirWarning: {
    ar: "لن نطلب منك مالاً أو كلمة مرور، ولن نتصل بك لنطلبها.",
    en: "We'll never ask you for money or a password, or call to ask for them.",
  },

  // The owner, on the wrong device. Said plainly: the reason is the product's
  // own promise, not a missing feature.
  ownerTitle: { ar: "خزنتك على جوّالك", en: "Your vault lives on your phone" },
  ownerBody: {
    ar: "لا تُفتح الخزنة من المتصفّح ولا نحفظ مفتاحها. هذا الموقع للإبلاغ عن وفاة وللورثة فقط.",
    en: "A vault can't be opened in a browser, and we don't hold its key. This site is only for reporting a death and for heirs.",
  },

  deliveryTitle: { ar: "ما تركه لك {name}", en: "What {name} left you" },
  deliveryUnknown: { ar: "شيء تُرك لك", en: "Something left for you" },
  deliveryIdentity: { ar: "أثبت هويتك ليُفتح", en: "Confirm who you are to open it" },
  deliveryChecking: { ar: "نراجع هويتك، وسنراسلك", en: "We're checking your identity — we'll email you" },
  deliveryReady: { ar: "جاهز للفتح", en: "Ready to open" },
  deliveryClosed: { ar: "لم يعد متاحاً", en: "No longer available" },
} as const satisfies Dictionary

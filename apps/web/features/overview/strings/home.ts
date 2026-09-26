import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The signed-in front door. It answers one question — is anything waiting for
 * me? — for two people: someone who reported a death, and an executor we
 * contacted.
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
    ar: "إن كان يستخدم وصيّة، ابدأ بالإبلاغ عن وفاته. لن تحصل على شيء بتقديم البلاغ — نحن نتواصل مع أوصيائه مباشرة.",
    en: "If they used Wassiya, start by reporting their death. Reporting doesn't give you anything — we contact their executors directly.",
  },
  doorClaimAction: { ar: "أبلغ عن وفاة", en: "Report a death" },
  doorClaimMeta: {
    ar: "دقائق قليلة، ويمكنك الإكمال لاحقاً",
    en: "A few minutes, and you can finish later",
  },
  doorExecutorTitle: { ar: "وصلتني رسالة من وصيّة", en: "I got a message from Wassiya" },
  doorExecutorBody: {
    ar: "إن سمّاك أحدهم وصيّاً، فافتح الرابط الموجود في الرسالة التي وصلتك — هو ما يربط التسليم بك. نتأكد من هويتك أولاً، ثم تفتح ما سُلِّم إليك بورقة الوصي.",
    en: "If someone named you as their executor, open the link in the message you received — it's what ties the handover to you. We confirm who you are first, then you open it with the executor sheet.",
  },
  doorExecutorMeta: { ar: "ابحث عن رسالة باسم وصيّة", en: "Look for a message from Wassiya" },
  doorExecutorWarning: {
    ar: "لن نطلب منك مالاً أو كلمة مرور، ولن نتصل بك لنطلبها.",
    en: "We'll never ask you for money or a password, or call to ask for them.",
  },

  // The owner, on the wrong device. Said plainly: the reason is the product's
  // own promise, not a missing feature.
  ownerTitle: { ar: "خزنتك على جوّالك", en: "Your vault lives on your phone" },
  ownerBody: {
    ar: "لا تُفتح الخزنة من المتصفّح ولا نحفظ مفتاحها. هذا الموقع للإبلاغ عن وفاة وللأوصياء فقط.",
    en: "A vault can't be opened in a browser, and we don't hold its key. This site is only for reporting a death and for executors.",
  },

  deliveryTitle: { ar: "ما سلّمه {name}", en: "What {name} handed over" },
  deliveryUnknown: { ar: "تسليم بانتظارك", en: "A handover waiting for you" },
  deliveryIdentity: { ar: "أثبت هويتك ليُفتح", en: "Confirm who you are to open it" },
  deliveryChecking: { ar: "نراجع هويتك، وسنراسلك", en: "We're checking your identity — we'll email you" },
  deliveryReady: { ar: "جاهز للفتح", en: "Ready to open" },
  deliveryClosed: { ar: "لم يعد متاحاً", en: "No longer available" },
} as const satisfies Dictionary

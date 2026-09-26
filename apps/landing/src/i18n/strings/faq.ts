import type { LabelSet } from "@/i18n/locale"

/**
 * The short, plain-words version of the help-centre seed
 * (`packages/backend/convex/support/help.ts`). Like it, no answer may state a
 * limit or a price. The first answer must keep saying that Wassiya holds no
 * key, and the lost-sheet answer must keep its price: with every sheet lost,
 * nobody can open what was handed over.
 */
export const FAQ: readonly { q: LabelSet; a: LabelSet }[] = [
  {
    q: { ar: "هل تستطيعون رؤية ما في خزنتي؟", en: "Can you see what's in my vault?" },
    a: {
      ar: "لا، ولا بعد رحيلك. خزنتك تُقفل على جوّالك قبل أن تصلنا، ولا نملك مفتاحها. وما تسلّمه لوصيّك لا يفتحه إلا ورقة الوصي أو ورقة استردادك، ولا نملك أياً منهما. وما أبقيته خاصاً لا يفتحه أحد.",
      en: "No — not even after you're gone. Your vault is locked on your phone before it reaches us, and we don't have its key. What you hand over to your executor opens only with their executor sheet or your recovery sheet, and we hold neither. What you keep private, nobody opens.",
    },
  },
  {
    q: { ar: "ماذا لو ضاع جوّالي؟", en: "What if I lose my phone?" },
    a: {
      ar: "ثبّت وصيّة على جوّالك الجديد، واستخدم ورقة الاسترداد لفتح خزنتك، ثم اطبع ورقة جديدة. بدون هذه الورقة لا يستطيع أحد فتح خزنتك — ولا نحن.",
      en: "Install Wassiya on your new phone, use your recovery sheet to open your vault, then print a new sheet. Without that sheet, nobody can open your vault — not even us.",
    },
  },
  {
    q: { ar: "ماذا لو ضاعت ورقة الوصي؟", en: "What if the executor sheet is lost?" },
    a: {
      ar: "وأنت حيّ: اطبع له ورقة جديدة من التطبيق، فتبطل القديمة. وبعد رحيلك: يستطيع وصيّك أن يستعمل ورقة استردادك بدلاً منها. وإن ضاعت الورقتان معاً فلا يستطيع أحد فتح ما تركته — ولا نحن، لأننا لا نملك أي مفتاح.",
      en: "While you're alive, print a new one in the app and the old one stops working. After you're gone, your executor can use your recovery sheet instead. If both are lost, nobody can open what you left — not even us, because we hold no key.",
    },
  },
  {
    q: { ar: "هل تخبرون وصيّي بشيء الآن؟", en: "Do you tell my executor anything now?" },
    a: {
      ar: "لا. لا نراسل الوصي بشيء قبل التحقق من الوفاة وانتهاء فترة الانتظار. أنت من يخبره: أعطه ورقته، أو ضعها مع وصيّتك. واحرص أن يبقى رقمه صحيحاً.",
      en: "No. We send your executor nothing until the death is verified and the waiting period is over. Telling them is up to you — give them their sheet, or keep it with your will. And keep their number up to date.",
    },
  },
  {
    q: {
      ar: "ماذا لو بلّغ أحد عن وفاتي وأنا حيّ؟",
      en: "What if someone reports my death while I'm alive?",
    },
    a: {
      ar: "نخبرك فوراً، ولا يُسلَّم شيء خلال فترة الانتظار. أكّد ببصمتك في التطبيق أنك بخير، فيتوقف البلاغ، ولا يستطيع من قدّمه المحاولة مجدداً لمدة ٩٠ يوماً.",
      en: "We tell you straight away, and nothing is handed over during the waiting period. Confirm with your fingerprint in the app that you're well, and the report stops — and whoever filed it can't try again for 90 days.",
    },
  },
  {
    q: { ar: "هل تقسم وصيّة الميراث؟", en: "Does Wassiya divide the inheritance?" },
    a: {
      ar: "لا. يستلم وصيّك ما اخترت تسليمه كما هو، ويُنفّذ وصيّتك. أما تقسيم الميراث فيحكمه الشرع والقانون.",
      en: "No. Your executor receives what you chose to hand over, as it is, and carries out your will. Dividing an inheritance is set by law.",
    },
  },
  {
    q: { ar: "ماذا يستلم الوصي، وإلى متى؟", en: "What does my executor receive, and for how long?" },
    a: {
      ar: "كل ما اخترت تسليمه، كاملاً، يفتحه على جهازه بورقته بعد أن يثبت هويته. أما ما أبقيته خاصاً فلا يصل لأحد. يبقى التسليم متاحاً سنة كاملة، ثم تُحذف الخزنة كلها نهائياً ولا يستطيع أحد فتح شيء منها بعدها — ولا نحن.",
      en: "Everything you chose to hand over, whole. They open it on their own device with their sheet, after proving who they are; what you kept private reaches no one. It stays available for a full year, then the whole vault is deleted for good and nobody can open any of it again — not even us.",
    },
  },
  {
    q: { ar: "ماذا لو توقف اشتراكي؟", en: "What if my subscription stops?" },
    a: {
      ar: "تبقى خزنتك كما هي، ويبقى التسليم لوصيّك قائماً. فقط لن تستطيع إضافة شيء جديد حتى تجدّد.",
      en: "Your vault stays as it is, and your executor still receives what you chose to hand over. You just can't add anything new until you renew.",
    },
  },
  {
    q: { ar: "هل أستطيع فتح خزنتي من الكمبيوتر؟", en: "Can I open my vault on a computer?" },
    a: {
      ar: "لا، خزنتك تُفتح من جوّالك فقط، وهذا جزء من حمايتها. موقعنا على الإنترنت مخصّص للإبلاغ عن وفاة وللأوصياء.",
      en: "No — your vault opens only on your phone, and that's part of what keeps it safe. Our website is for reporting a death and for executors.",
    },
  },
  {
    q: { ar: "كيف أبلّغ عن وفاة؟", en: "How do I report a death?" },
    a: {
      ar: "اضغط «أبلغ عن وفاة» في الأعلى، ثم أدخل بريد المتوفّى، وأرفق شهادة الوفاة. سنراسلك عند كل خطوة.",
      en: "Tap “Report a death” above, enter the email the person used and attach the death certificate. We'll email you at every step.",
    },
  },
]

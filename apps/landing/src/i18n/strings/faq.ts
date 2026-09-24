import type { LabelSet } from "@/i18n/locale"

/**
 * The short, plain-words version of the help-centre seed
 * (`packages/backend/convex/support/help.ts`). Like it, no answer may state a
 * limit or a price — and the first answer must keep saying what happens to
 * what an owner leaves their heirs.
 */
export const FAQ: readonly { q: LabelSet; a: LabelSet }[] = [
  {
    q: { ar: "هل تستطيعون رؤية ما في خزنتي؟", en: "Can you see what's in my vault?" },
    a: {
      ar: "لا. كل شيء يُقفل على جوّالك قبل أن يصلنا، ولا نملك المفتاح. ما دمت حيّاً لا يراه أحد غيرك. وبعد رحيلك، نفتح فقط ما خصّصته لكل وارث لنسلّمه له، بعد التأكد من هويته.",
      en: "No. Everything is locked on your phone before it reaches us, and we don't have the key. While you're alive, nobody else can see it. After you're gone, we open only what you set aside for each heir, to hand it to them once we've confirmed who they are.",
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
    q: { ar: "لماذا لا يعلم ورثتي بشيء الآن؟", en: "Why don't my heirs know anything now?" },
    a: {
      ar: "لحمايتك وحمايتهم. لا نتواصل مع أي وارث قبل التأكد من الوفاة وانتهاء فترة الانتظار. لذلك احرص أن تبقى أرقامهم صحيحة.",
      en: "To protect you and them. We don't contact any heir until the death is confirmed and the waiting period is over. So keep their phone numbers up to date.",
    },
  },
  {
    q: { ar: "هل تقسم وصيّة الميراث؟", en: "Does Wassiya divide the inheritance?" },
    a: {
      ar: "لا. أنت تختار ما يأخذه كل شخص، ونحن نوصله كما هو. أما تقسيم الميراث فيحكمه الشرع والقانون.",
      en: "No. You choose what each person gets, and we deliver it as it is. Dividing an inheritance is set by law.",
    },
  },
  {
    q: { ar: "ماذا يستلم الوارث، وإلى متى؟", en: "What does an heir receive, and for how long?" },
    a: {
      ar: "يستلم ما خصّصته له فقط، ويفتحه على جهازه. يبقى متاحاً سنة كاملة، ثم يُحذف نهائياً ولا يستطيع أحد فتحه بعدها — ولا نحن.",
      en: "Only what you set aside for them, and they open it on their own device. It stays available for a full year, then it's deleted for good and nobody can open it again — not even us.",
    },
  },
  {
    q: { ar: "ماذا لو توقف اشتراكي؟", en: "What if my subscription stops?" },
    a: {
      ar: "تبقى خزنتك كما هي، ويصل ما تركته لورثتك. فقط لن تستطيع إضافة شيء جديد حتى تجدّد.",
      en: "Your vault stays as it is, and your heirs still receive what you left them. You just can't add anything new until you renew.",
    },
  },
  {
    q: { ar: "هل أستطيع فتح خزنتي من الكمبيوتر؟", en: "Can I open my vault on a computer?" },
    a: {
      ar: "لا، خزنتك تُفتح من جوّالك فقط، وهذا جزء من حمايتها. موقعنا على الإنترنت مخصّص للإبلاغ عن وفاة وللورثة.",
      en: "No — your vault opens only on your phone, and that's part of what keeps it safe. Our website is for reporting a death and for heirs.",
    },
  },
  {
    q: { ar: "كيف أبلّغ عن وفاة؟", en: "How do I report a death?" },
    a: {
      ar: "اضغط «أبلغ عن وفاة» في الأعلى، ثم أدخل بريد المتوفّى، وأثبت هويتك، وأرفق شهادة الوفاة. سنراسلك عند كل خطوة.",
      en: "Tap “Report a death” above, enter the email the person used, confirm who you are and attach the death certificate. We'll email you at every step.",
    },
  },
]

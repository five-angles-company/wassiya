import type { Dictionary } from "@/lib/i18n/locale"

/** The three doors off the funnel: resume, guardian, contact. */
export const CLAIM_SUPPORT = {
  // ---- /claim/resume ------------------------------------------------------
  resumeMetaTitle: { ar: "متابعة طلب سابق · وصيّة", en: "Resume a claim · Wassiya" },
  resumeTitle: { ar: "متابعة طلب سابق", en: "Resume a claim" },
  resumeLede: {
    ar: "رابط طلبك هو الطريقة الوحيدة لفتحه — ولا نستطيع استخراجه من رقم الطلب.",
    en: "Your claim link is the only way back into it — and we cannot look it up from the claim number.",
  },
  resumeWhyTitle: { ar: "لماذا لا يكفي رقم الطلب؟", en: "Why isn't the claim number enough?" },
  resumeWhyBody: {
    ar: "رقم الطلب (مثل C-4482) مختصر ليُقرأ في الهاتف، وقد يتكرّر بين طلبين. الرابط وحده هو ما يثبت أنك صاحب الطلب — ولو فتحنا الطلب بالرقم لأمكن لأي شخص تخمينه.",
    en: "The claim number — C-4482 and the like — is short enough to read down a phone, and two claims can share one. The link is what proves the claim is yours; opening a claim by number would let anyone guess their way in.",
  },
  resumeFindTitle: { ar: "ابحث في بريدك", en: "Search your email" },
  resumeFindBody: {
    ar: "أرسلنا الرابط إلى البريد الذي سجّلته عند تقديم البلاغ. ابحث عن «وصيّة» أو عن رقم طلبك، وتحقّق من مجلد الرسائل غير المرغوبة.",
    en: "We emailed the link to the address you gave when you filed. Search for \u201cWassiya\u201d or for your claim number, and check your spam folder.",
  },
  resumeStuck: {
    ar: "لم تجده؟ تواصل معنا ومعك رقم الطلب.",
    en: "Still can't find it? Contact us with your claim number.",
  },

  // ---- /claim/guardian ----------------------------------------------------
  guardianMetaTitle: { ar: "دور الوصي · وصيّة", en: "The guardian's role · Wassiya" },
  guardianTitle: { ar: "أنت وصي", en: "You are a guardian" },
  guardianLede: {
    ar: "اختارك شخص ليضع في يدك خطوة واحدة لا تتم بدونها. هذه الصفحة تشرح ما هي، ومتى.",
    en: "Someone chose you to hold one step that cannot happen without you. This page explains what it is, and when.",
  },
  guardianWhatTitle: { ar: "ما الذي تحرسه", en: "What you are guarding" },
  guardianWhatBody: {
    ar: "لا تملك الخزنة ولا ترى محتواها. تحمل نصف مفتاح صندوق الوارث — النصف الآخر لدينا، ولا يُفتح الصندوق إلا باجتماعهما. هذا يعني أننا لا نستطيع التسليم وحدنا، ولا تستطيع أنت.",
    en: "You do not own the vault and you cannot see inside it. You hold half of an heir's box key — we hold the other half, and the box opens only when the two meet. That means we cannot hand anything over alone, and neither can you.",
  },
  guardianWhenTitle: { ar: "متى نطلبك", en: "When we ask you" },
  guardianWhenBody: {
    ar: "مرتين على الأكثر، وربما بعد سنوات: مرة لتأكيد الوفاة بعد انتهاء مدة الاعتراض، ومرة لتسليم نصيبك من المفتاح عند الإفراج. لا شيء مطلوب منك بينهما.",
    en: "Twice at most, and possibly years from now: once to confirm the death after the objection period ends, and once to hand over your half of the key at release. Nothing is asked of you in between.",
  },
  guardianNotTitle: { ar: "ما لا يُطلب منك", en: "What is never asked of you" },
  guardianNotBody: {
    ar: "لا تُستخدم في استرداد الخزنة لصاحبها — ذلك يتم بورقة الاسترداد وحدها. ولا يُطلب منك مال، ولا قرار في تقسيم التركة.",
    en: "You are not part of recovering the vault for its owner — that is the printed recovery sheet alone. You will never be asked for money, or for a decision about how an estate is divided.",
  },
  guardianSoonTitle: { ar: "شاشات الوصي قريباً", en: "The guardian screens are coming" },
  guardianSoonBody: {
    ar: "نبني الآن المكان الذي تقبل فيه الدعوة وتؤدي دورك. إن وصلتك دعوة، احتفظ بالرابط — سنراسلك عندما تصبح جاهزة.",
    en: "We are building the place where you accept an invitation and do your part. If you have received one, keep the link — we will write to you when it is ready.",
  },

  // ---- /claim/contact -----------------------------------------------------
  contactMetaTitle: { ar: "تواصل معنا · وصيّة", en: "Contact us · Wassiya" },
  contactTitle: { ar: "تواصل معنا", en: "Contact us" },
  contactLede: {
    ar: "إن كان لديك طلب جارٍ، اذكر رقمه — يساعدنا في الوصول إليه دون أن تشرح من البداية.",
    en: "If you have a claim in progress, quote its number — it lets us find it without you having to explain from the start.",
  },
  contactRefLabel: { ar: "رقم الطلب (إن وُجد)", en: "Claim number (if you have one)" },
  contactEmailLabel: { ar: "بريدك", en: "Your email" },
  contactMessageLabel: { ar: "رسالتك", en: "Your message" },
  contactSend: { ar: "أرسل", en: "Send" },
  contactNote: {
    ar: "نردّ خلال يوم عمل. لا تُرسل صوراً لهويتك أو أي مستند حسّاس عبر هذا النموذج.",
    en: "We reply within one working day. Do not send identity photographs or any sensitive document through this form.",
  },
  contactSoon: {
    ar: "النموذج قيد التوصيل. حتى ذلك الحين راسلنا على العنوان أدناه.",
    en: "The form is not connected yet. Until it is, write to us at the address below.",
  },
} as const satisfies Dictionary

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

  needsYouTitle: { ar: "ما يحتاجك الآن", en: "What needs you now" },
  nothingTitle: { ar: "لا شيء مطلوب منك", en: "Nothing needs you" },
  nothingBody: {
    ar: "سنراسلك على بريدك عند أي تغيّر. لا حاجة لفتح هذه الصفحة يومياً.",
    en: "We'll email you at any change. There's no need to open this page daily.",
  },

  // The two-door state.
  chooseTitle: { ar: "بم نبدأ؟", en: "Where would you like to start?" },
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
  doorGuardianTitle: { ar: "وصلتني دعوة وصاية", en: "I was invited as a guardian" },
  doorGuardianBody: {
    ar: "افتح الرابط الكامل من بريد الدعوة. لا نستطيع فتح الوصاية لك من هنا — الدعوة نفسها هي ما يثبت أنك المقصود.",
    en: "Open the full link from your invitation email. We can't start a guardianship for you from here — the invitation itself is what proves it was meant for you.",
  },

  // The owner, who has arrived at the wrong app. Said plainly, because the
  // reason is the product's own promise rather than a missing feature.
  ownerTitle: { ar: "خزنتك على جوّالك", en: "Your vault lives on your phone" },
  ownerBody: {
    ar: "لا تُفتح الخزنة من المتصفّح ولا نحفظ مفتاحها لدينا. هذا الموقع للورثة والأوصياء فقط.",
    en: "A vault can't be opened in a browser and we don't hold its key. This site is for heirs and guardians only.",
  },

  // Summary rows.
  yourReports: { ar: "بلاغاتك", en: "Your reports" },
  yourReportsMeta: { ar: "{n} بلاغ", en: "{n} reports" },
  yourBoxes: { ar: "صناديقك الجاهزة", en: "Your ready boxes" },
  yourBoxesMeta: { ar: "{n} جاهز", en: "{n} ready" },
  yourVaults: { ar: "الخزائن التي توصي عليها", en: "Vaults you guard" },
  yourVaultsMeta: { ar: "{n} خزنة", en: "{n} vaults" },

  // Duty rows, phrased as an ask rather than as a status.
  dutyConfirm: { ar: "تأكيد وفاة {name}", en: "Confirm {name}'s death" },
  dutyHandover: { ar: "تسليم نصف مفتاحك — خزنة {name}", en: "Hand over your key half — {name}'s vault" },
  claimNeedsIdentity: { ar: "أكمل التحقق من هويتك", en: "Finish verifying your identity" },
  claimNeedsCertificate: { ar: "ارفع شهادة الوفاة", en: "Upload the death certificate" },
  claimReady: { ar: "صندوقك جاهز — افتحه", en: "Your box is ready — open it" },
  open: { ar: "افتح", en: "Open" },
} as const satisfies Dictionary

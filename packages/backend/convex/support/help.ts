// The help center. Public reads, console edits.
//
// ⚠️ An article must never state a plan limit or a price: both move without a
// deploy (AGENTS.md "Plans"), and an article would quietly go stale. Point to
// the plan screen instead.
import { v } from "convex/values"

import type { Doc } from "../_generated/dataModel"
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "../_generated/server"
import { writeStaffAudit } from "../audit"
import { requirePermission } from "../model/access"
import { localeValidator } from "../model/support"

const audienceValidator = v.union(
  v.literal("owner"),
  v.literal("executor"),
  v.literal("reporter"),
  v.literal("all")
)
const localised = v.object({ ar: v.string(), en: v.string() })
const MAX_ARTICLES = 200

/** Published articles for these audiences, plus those for everyone, in order. */
export const articles = query({
  args: {
    audiences: v.array(
      v.union(v.literal("owner"), v.literal("executor"), v.literal("reporter"))
    ),
    locale: localeValidator,
  },
  handler: async (ctx, { audiences, locale }) => {
    const rows: Doc<"helpArticles">[] = []
    for (const key of [...new Set(audiences), "all"] as const) {
      rows.push(
        ...(await ctx.db
          .query("helpArticles")
          .withIndex("by_audience_and_order", (q) => q.eq("audience", key))
          .take(MAX_ARTICLES))
      )
    }
    return rows
      .filter((row) => row.published)
      .sort((a, b) => a.order - b.order)
      .map((row) => ({
        slug: row.slug,
        title: row.title[locale],
        body: row.body[locale],
      }))
  },
})

export const adminArticles = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "support.read")
    const rows = await ctx.db.query("helpArticles").take(MAX_ARTICLES)
    return rows
      .sort((a, b) => a.order - b.order)
      .map((row) => ({
        id: row._id,
        slug: row.slug,
        audience: row.audience,
        order: row.order,
        published: row.published,
        title: row.title,
        body: row.body,
        updatedAt: row.updatedAt,
      }))
  },
})

export const adminSaveArticle = mutation({
  args: {
    id: v.optional(v.id("helpArticles")),
    slug: v.string(),
    audience: audienceValidator,
    order: v.number(),
    published: v.boolean(),
    title: localised,
    body: localised,
  },
  handler: async (ctx, { id, ...fields }) => {
    const actor = await requirePermission(ctx, "support.manage")
    const slug = fields.slug.trim().toLowerCase()
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
      throw new Error("A slug is lowercase letters, digits and dashes")
    }
    const clash = await ctx.db
      .query("helpArticles")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first()
    if (clash !== null && clash._id !== id) {
      throw new Error("Another article already uses that slug")
    }
    const row = { ...fields, slug, updatedAt: Date.now() }
    const articleId =
      id === undefined
        ? await ctx.db.insert("helpArticles", row)
        : (await ctx.db.replace("helpArticles", id, row), id)
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "help.article_saved",
      meta: { slug },
    })
    return articleId
  },
})

export const adminDeleteArticle = mutation({
  args: { id: v.id("helpArticles") },
  handler: async (ctx, { id }) => {
    const actor = await requirePermission(ctx, "support.manage")
    const row = await ctx.db.get("helpArticles", id)
    if (row === null) return null
    await ctx.db.delete("helpArticles", id)
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "help.article_deleted",
      meta: { slug: row.slug },
    })
    return null
  },
})

/**
 * A starting set, inserted only where the slug is free.
 * `npx convex run support/help:seedArticles`
 */
export const seedArticles = internalMutation({
  args: {},
  handler: async (ctx) => {
    let created = 0
    for (const [index, article] of SEED.entries()) {
      created += (await insertIfFree(ctx, article, (index + 1) * 10)) ? 1 : 0
    }
    return { created }
  },
})

/**
 * Put the named articles back to their seed text and audience, after either
 * changed in code. It overwrites any console edit to those slugs, which is why
 * it takes an explicit list and nothing is refreshed by default.
 * `npx convex run support/help:refreshSeedArticles '{"slugs":["report-a-death"]}'`
 */
export const refreshSeedArticles = internalMutation({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, { slugs }) => {
    let refreshed = 0
    for (const article of SEED.filter((row) => slugs.includes(row.slug))) {
      const existing = await ctx.db
        .query("helpArticles")
        .withIndex("by_slug", (q) => q.eq("slug", article.slug))
        .first()
      if (existing === null) continue
      await ctx.db.patch("helpArticles", existing._id, {
        audience: article.audience,
        title: article.title,
        body: article.body,
        updatedAt: Date.now(),
      })
      refreshed += 1
    }
    return { refreshed }
  },
})

type SeedArticle = Pick<
  Doc<"helpArticles">,
  "slug" | "audience" | "title" | "body"
>

async function insertIfFree(
  ctx: MutationCtx,
  article: SeedArticle,
  order: number
): Promise<boolean> {
  const existing = await ctx.db
    .query("helpArticles")
    .withIndex("by_slug", (q) => q.eq("slug", article.slug))
    .first()
  if (existing !== null) return false
  await ctx.db.insert("helpArticles", {
    ...article,
    order,
    published: true,
    updatedAt: Date.now(),
  })
  return true
}

const SEED: SeedArticle[] = [
  {
    slug: "never-share-your-sheet",
    audience: "all",
    title: {
      ar: "لن نطلب منك وثيقة الاسترداد أبداً",
      en: "We will never ask for your recovery sheet",
    },
    body: {
      ar: "وثيقة الاسترداد تفتح الخزنة لمن يحملها. لا أحد في وصيّة يحتاجها، ولن يطلبها منك أحد منّا — لا في المحادثة ولا بالهاتف ولا بالبريد. إن طلبها أحد، فهو ليس نحن.",
      en: "The recovery sheet opens the vault for whoever holds it. Nobody at Wassiya needs it and none of us will ever ask for it — not in chat, by phone or by email. If someone asks, it is not us.",
    },
  },
  {
    slug: "can-wassiya-read-my-vault",
    audience: "owner",
    title: {
      ar: "هل يستطيع فريق وصيّة قراءة خزنتي؟",
      en: "Can Wassiya read my vault?",
    },
    body: {
      ar: "لا، ولا بعد رحيلك. تُشفَّر خزنتك على جهازك قبل أن تصلنا، ومفتاحها لا يغادر جهازك إلا مغلقاً. وما تسلّمه لأوصيائك لا يفتحه إلا ورقة الوصي أو ورقة استردادك، ولا نملك أياً منهما. لذلك لا يستطيع فريق الدعم رؤية ما في خزنتك ولا استرجاعه لك.",
      en: "No — not even after you are gone. Your vault is encrypted on your phone before it reaches us, and its key only leaves your phone locked. What you hand over to your executors opens only with an executor sheet or your recovery sheet, and we hold neither. That is also why support cannot see what is in your vault or recover it for you.",
    },
  },
  {
    slug: "lost-my-phone",
    audience: "owner",
    title: { ar: "فقدت هاتفي — ماذا أفعل؟", en: "I lost my phone — what now?" },
    body: {
      ar: "ثبّت وصيّة على الهاتف الجديد، وسجّل الدخول، ثم اختر الاسترداد وأدخل الرمز المطبوع على وثيقة الاسترداد. بعد ذلك اطبع وثيقة جديدة — فالقديمة تبطل — وألغِ الجهاز المفقود من الإعدادات ← الأجهزة. بدون الوثيقة لا نستطيع فتح خزنتك.",
      en: "Install Wassiya on the new phone, sign in, choose recovery and type the code printed on your recovery sheet. Then print a new sheet — that voids the old one — and revoke the lost device under Settings → Devices. Without the sheet we cannot open your vault.",
    },
  },
  {
    slug: "identity-check-stuck",
    audience: "owner",
    title: {
      ar: "لم يكتمل التحقق من هويتي",
      en: "My identity check did not go through",
    },
    body: {
      ar: "تأكّد من أن الوثيقة سارية وأن الصورة واضحة دون انعكاس، وأن وجهك ظاهر بإضاءة جيدة. إن استنفدت المحاولات، راسلنا من هنا وسنراجع الأمر ونعيد لك المحاولات.",
      en: "Check that the document is valid, the photo is sharp with no glare, and your face is well lit. If you have used up your attempts, message us here and we will look at it and give them back.",
    },
  },
  {
    slug: "why-heirs-know-nothing",
    audience: "owner",
    title: {
      ar: "هل يعرف الوصي أنني اخترته؟",
      en: "Does my executor know I chose them?",
    },
    body: {
      ar: "منّا لا: لا نراسل الوصي ولا نخبره بشيء قبل أن تتحقق الوفاة وتنتهي مهلة الاعتراض. أما ورقة الوصي فأنت تقرّر: تعطيها له الآن، أو تضعها مع وصيّتك. احرص على أن يبقى رقمه صحيحاً.",
      en: "Not from us: we do not contact your executor or tell them anything until a death is verified and the objection period has ended. The executor sheet is your call — give it to them now, or keep it with your will. Keep their number up to date.",
    },
  },
  {
    slug: "executor-sheet",
    audience: "owner",
    title: { ar: "ما ورقة الوصي؟", en: "What is the executor sheet?" },
    body: {
      ar: "ورقة يطبعها التطبيق لكل وصيّ. لا تفتح شيئاً وأنت حيّ؛ وبعد التحقق من وفاتك يفتح بها الوصي ما اخترت تسليمه. إن ضاعت وأنت حيّ، اطبع ورقة جديدة فتبطل القديمة. ولن نطلبها منك أبداً.",
      en: "A sheet the app prints for each executor. It opens nothing while you are alive; after your death is verified, your executor opens what you chose to hand over with it. If it is lost while you are alive, print a new one and the old one stops working. We will never ask you for it.",
    },
  },
  {
    slug: "reported-while-alive",
    audience: "owner",
    title: {
      ar: "بلّغ أحد عن وفاتي وأنا حيّ",
      en: "Someone reported my death, and I am alive",
    },
    body: {
      ar: "لا يُسلَّم شيء خلال فترة الانتظار. افتح وصيّة وأكّد ببصمتك في الشاشة الرئيسية أنك بخير، فيتوقف البلاغ فوراً، ولا يستطيع من قدّمه المحاولة مجدداً لمدة ٩٠ يوماً.",
      en: "Nothing is handed over during the waiting period. Open Wassiya and confirm with your fingerprint on the home screen that you are well — the report stops at once, and whoever filed it cannot try again for 90 days.",
    },
  },
  {
    slug: "message-from-wassiya",
    audience: "executor",
    title: {
      ar: "وصلتني رسالة من وصيّة — ما هذه؟",
      en: "I got a message from Wassiya — what is it?",
    },
    body: {
      ar: "تعني الرسالة أن شخصاً سمّاك وصياً على ما تركه لدينا. افتح الرابط، وسجّل الدخول، وأثبت هويتك، ثم افتح ما تُرك بورقة الوصي — لا يُفتح شيء قبل ذلك. لا نذكر في الرسالة اسم أحد ولا ما تُرك، حمايةً لك إن وصلت إلى غيرك.",
      en: "It means someone named you as the executor of what they left with us. Open the link, sign in, verify your identity, then open what was left with the executor sheet — nothing opens before that. The message names no one and nothing, in case it reached someone else.",
    },
  },
  {
    slug: "lost-executor-sheet",
    audience: "executor",
    title: { ar: "لم أجد ورقة الوصي", en: "I cannot find the executor sheet" },
    body: {
      ar: "ابحث عنها مع وصيّة المتوفّى وأوراقه المهمة. إن لم تجدها وعثرت على ورقة استرداده، تستطيع استعمالها بدلاً منها، وتفتح ما اختار تسليمه فقط. إن لم تجد أياً منهما فلا نستطيع فتح شيء، لأننا لا نملك أي مفتاح.",
      en: "Look with the deceased's will and important papers. If you cannot find it but find their recovery sheet, you can use that instead — it opens only what they chose to hand over. If you find neither, we cannot open anything: we hold no key.",
    },
  },
  {
    slug: "heir-identity",
    audience: "executor",
    title: {
      ar: "لماذا يجب أن أُثبت هويتي؟",
      en: "Why do I have to verify my identity?",
    },
    body: {
      ar: "لأننا نسلّم فقط لمن سمّاه صاحب الخزنة وصياً. نطابق هويتك الموثّقة مع رقم الهوية الذي سجّله عنك، وإن لم تتطابق تلقائياً يراجعها أحد أفراد فريقنا بنفسه.",
      en: "Because we deliver only to the person the vault owner named as executor. We match your verified identity against the ID number they registered for you, and if it does not match automatically a member of our team reviews it by hand.",
    },
  },
  {
    slug: "report-a-death",
    audience: "reporter",
    title: { ar: "كيف أبلّغ عن وفاة؟", en: "How do I report a death?" },
    body: {
      ar: "أدخل بريد المتوفّى الذي استخدمه في وصيّة، وأرفق شهادة الوفاة. نراجع البلاغ ونراسلك عند كل تغيّر. لا تستلم شيئاً بتقديم البلاغ — نتواصل نحن مع الأوصياء مباشرة.",
      en: "Enter the email the person used with Wassiya and attach the death certificate. We review the report and email you at each change. Filing a report gives you nothing yourself — we contact the executors directly.",
    },
  },
]

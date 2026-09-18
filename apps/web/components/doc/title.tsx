import type { ReactNode } from "react"

/**
 * The page's identity: what this is, and one quiet line of provenance under it.
 *
 * There is no status badge beside it. Status is a sentence in `StatusLine`, not
 * a pill — a coloured chip reporting "awaiting veto" to someone who has just
 * lost a parent is a database field wearing a costume.
 *
 * ## ⚠️ `eyebrow` exists because one page forked this component to get it
 *
 * `/file` wrote its own header rather than use this one, and said why: it wants
 * a line **above** the title — how long this takes, and that you can stop — which
 * answers the reader's real question before they have committed to reading
 * anything. That was a good reason and the wrong remedy: a page that opts out of
 * the title component is a page whose title silently stops tracking every later
 * change to this one.
 *
 * ⚠️ **Above, not below.** `meta` is provenance — who filed this, when — and it
 * is read after the title or not at all. An eyebrow is read first, so it carries
 * only what changes whether somebody starts.
 */
export function DocTitle({
  title,
  meta,
  eyebrow,
}: {
  title: string
  meta?: ReactNode
  eyebrow?: string
}) {
  return (
    <header>
      {eyebrow !== undefined && (
        <p className="text-muted-foreground mb-2.5 text-[13px] font-semibold">
          {eyebrow}
        </p>
      )}
      <h1 className="font-heading text-[27px] leading-[1.25] font-extrabold md:text-[31px]">
        {title}
      </h1>
      {meta !== undefined && (
        <p className="text-muted-foreground mt-2.5 text-[13px]">{meta}</p>
      )}
    </header>
  )
}

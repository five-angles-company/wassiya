"use client"

import { useEffect, useRef } from "react"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { MessagesSquareIcon, PlusIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { Placeholder } from "@/components/placeholder"
import { COMMON } from "@/lib/i18n/strings/common"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"

/**
 * The help centre for the web's two audiences, executors and people reporting a
 * death — owners have theirs in the app. `<details>` so it works before
 * hydration.
 *
 * Each article's id is its slug, so another screen can link to `/help#<slug>`.
 * The articles arrive after the browser has already looked for that anchor,
 * so the linked one is opened and scrolled to here, once.
 */
export function HelpCenter() {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const common = t(COMMON, locale)
  const articles = useQuery(api.support.help.articles, { audiences: ["executor", "reporter"], locale })
  const anchored = useRef(false)

  useEffect(() => {
    if (articles === undefined || anchored.current) return
    anchored.current = true
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
    if (target instanceof HTMLDetailsElement) {
      target.open = true
      target.scrollIntoView({ block: "start" })
    }
  }, [articles])

  return (
    <div className="flex flex-col gap-8">
      {articles === undefined ? (
        <Placeholder label={common.loading} className="h-72" />
      ) : (
        articles.length > 0 && (
          <div className="flex flex-col gap-3">
            {articles.map((article) => (
              <details
                key={article.slug}
                id={article.slug}
                className="group border-border bg-card/50 open:bg-card rounded-card scroll-mt-28 border transition-[background-color,box-shadow] open:shadow-[var(--shadow-raised)]"
              >
                <summary className="font-heading flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-[17px] leading-[1.6] font-extrabold [&::-webkit-details-marker]:hidden">
                  {article.title}
                  <span
                    aria-hidden
                    className="bg-background group-open:bg-primary group-open:text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-300 group-open:rotate-45"
                  >
                    <PlusIcon className="size-4" strokeWidth={2.75} />
                  </span>
                </summary>
                <p className="text-foreground/75 px-6 pb-6 text-[15.5px] leading-[1.9] whitespace-pre-line">
                  {article.body}
                </p>
              </details>
            ))}
          </div>
        )
      )}

      <section className="rise-in bg-card border-border rounded-panel relative overflow-hidden border p-7 shadow-[var(--shadow-overlay)] md:p-9">
        <span aria-hidden className="bg-brand absolute inset-x-0 top-0 h-1" />
        <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
          <IconDisc icon={MessagesSquareIcon} tone="attention" size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-[23px] leading-snug font-black">{labels.contactTitle}</h2>
            <p className="text-foreground/75 mt-2 max-w-[56ch] text-[15.5px] leading-[1.85]">{labels.contactBody}</p>
          </div>
          <ButtonLink href="/help/chat" size="lg">
            {labels.startChat}
          </ButtonLink>
        </div>
      </section>
    </div>
  )
}

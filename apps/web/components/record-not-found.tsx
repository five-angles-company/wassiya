"use client"

import Link from "next/link"
import { SearchXIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * A detail screen whose record is not there.
 *
 * Reachable three ways and none of them exotic: a mistyped URL, a bookmark to a
 * claim that was closed, and a link an email client truncated — which is a real
 * failure mode for a URL forwarded between relatives.
 *
 * It renders *inside* the shell rather than replacing it. Nothing is wrong with
 * the session, so the rail stays and the way out is a link back to the list.
 *
 * The id is shown because it is the only thing that distinguishes this screen
 * from any other empty one, and because someone chasing a broken link needs to
 * see which id failed. It is a machine string: LTR and unshaped even inside
 * Arabic prose, or the bidi algorithm reorders it and it can no longer be
 * copied out accurately.
 */
export function RecordNotFound({
  id,
  backHref,
  backLabel,
}: {
  id: string
  backHref: string
  backLabel: string
}) {
  const labels = t(COMMON, useLocale())

  return (
    <div className="border-border rounded-card flex flex-col items-start gap-4 border p-6">
      <span
        aria-hidden
        className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-full"
      >
        <SearchXIcon className="size-5" />
      </span>

      <div>
        <h1 className="font-heading text-[18px] font-extrabold">
          {labels.notFoundTitle}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-[54ch] text-[14.5px] leading-[1.7]">
          {labels.notFoundBody}
        </p>
      </div>

      <p dir="ltr" className="text-muted-foreground font-mono text-[12px]">
        {id}
      </p>

      <Link
        href={backHref}
        className="border-border hover:bg-muted rounded-full border px-5 py-2.5 text-[14px] font-semibold transition-colors"
      >
        {backLabel}
      </Link>
    </div>
  )
}

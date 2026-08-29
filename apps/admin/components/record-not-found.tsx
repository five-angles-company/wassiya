"use client"

import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { SearchXIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * A detail screen whose record is not there.
 *
 * Both detail routes take an id straight off the path, so this is reachable
 * three ways and none of them is exotic: a mistyped URL, a bookmark to an
 * account that has since gone, and a link out of the audit log — which is
 * append-only and therefore outlives the users it names.
 *
 * It renders *inside* the shell rather than replacing it, unlike
 * `NotAuthorised`. Nothing is wrong with the session here, so the sidebar
 * stays and the way out is a link back to the list rather than a sign-out.
 *
 * The id is shown because it is the only thing that distinguishes this screen
 * from any other empty one — an operator chasing a stale link needs to see
 * which id failed to know where it came from.
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
    <div className="flex flex-col items-start gap-4 rounded-xl border p-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <SearchXIcon className="size-5" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-lg font-semibold">
          {labels.notFoundTitle}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          {labels.notFoundBody}
        </p>
      </div>

      {/* An id is a machine string: LTR and unshaped even inside Arabic prose,
          or bidi reordering makes it unreadable and uncopyable. */}
      <p dir="ltr" className="font-mono text-xs text-muted-foreground">
        {id}
      </p>

      <Button variant="outline" asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  )
}

"use client"

import { Button } from "@workspace/ui/components/button"
import { RotateCwIcon, TriangleAlertIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * What a thrown query looks like when it is caught.
 *
 * Every screen here subscribes to Convex, and a Convex query reports failure by
 * throwing into React — `requireAdmin` on a session that has just lost its
 * role, a deployment mid-push, a dropped socket. Without a boundary above them
 * that unmounts the entire route, sidebar included, and leaves the operator on
 * a blank page with no way back except the browser's own controls.
 *
 * `reset()` re-renders the segment, which is the right move for exactly the
 * transient cases above: nothing needs reloading, the subscription just needs
 * trying again.
 *
 * **The message is not shown.** A Convex error can carry a function path and an
 * internal message, and this console is read by staff rather than by the people
 * who wrote it. The digest is enough to find the real thing in the logs.
 */
export function ErrorPanel({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const labels = t(COMMON, useLocale())

  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-destructive/40 p-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <TriangleAlertIcon className="size-5" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-lg font-semibold">
          {labels.errorTitle}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          {labels.errorBody}
        </p>
      </div>

      {error.digest !== undefined && (
        <p dir="ltr" className="font-mono text-xs text-muted-foreground">
          {labels.errorDigest}: {error.digest}
        </p>
      )}

      <Button variant="outline" onClick={reset}>
        <RotateCwIcon />
        {labels.retry}
      </Button>
    </div>
  )
}

"use client"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * What a thrown query looks like when it is caught.
 *
 * Every screen here subscribes to Convex, and a Convex query reports failure by
 * throwing into React. Without a boundary above them that unmounts the whole
 * route, leaving a blank page — and the person on the other side of it is
 * usually bereaved, mid-claim, and in no mood to guess.
 *
 * `reset()` re-renders the segment, which is the right move for what this
 * actually catches: a dropped socket, a deployment mid-push, a session that
 * expired between two clicks. The copy says so, and says nothing was lost,
 * because the fear on this particular site is that a half-finished claim
 * vanished.
 *
 * **The message is not shown.** A Convex error carries a function path and
 * internal text; the digest is enough to find the real thing in the logs.
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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 md:px-8">
      <div className="border-border rounded-card border p-6">
        <h1 className="text-[22px] leading-[1.3]">{labels.errorTitle}</h1>
        <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
          {labels.errorBody}
        </p>

        {error.digest !== undefined && (
          <p className="text-sand-600 ltr-isolate mt-4 font-mono text-[12px]">
            {labels.errorDigest}: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="border-border hover:bg-sand-200 mt-6 rounded-full border px-6 py-2.5 text-[14.5px] transition-colors"
        >
          {labels.retry}
        </button>
      </div>
    </div>
  )
}

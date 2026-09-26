"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { useMutation } from "convex/react"
import { LockKeyholeIcon, PackageXIcon, RotateCwIcon, ShieldAlertIcon } from "lucide-react"

import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"
import { NoticeCard } from "@/components/notice-card"
import { Placeholder } from "@/components/placeholder"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { OpenedHandover } from "@/features/handover/components/opened-handover"
import { SheetGate } from "@/features/handover/components/sheet-gate"
import {
  sheetsOnRecord,
  unlockHandover,
  wipeHandover,
  type HandoverResponse,
  type OpenedHandover as Opened,
} from "@/features/handover/lib/open-handover"
import { HANDOVER } from "@/features/handover/strings/handover"

type State =
  | { status: "fetching" }
  | { status: "failed" }
  | { status: "locked"; response: HandoverResponse }
  | { status: "open"; handover: Opened }

/**
 * ٧.٦ — the executor's handover: the sheet code, and what it opens.
 *
 * `handover.open` re-checks every gate and audits the visit, so it is called
 * once per mount, not per attempt at the code. It returns wrappers only; the
 * sheet opens them in this tab, and the keys live exactly as long as this
 * component is mounted.
 */
export function ExecutorHandover({ deliveryId }: { deliveryId: Id<"deliveries"> }) {
  const locale = useLocale()
  const labels = t(HANDOVER, locale)
  const common = t(COMMON, locale)
  const openHandover = useMutation(api.handover.open)
  const [state, setState] = useState<State>({ status: "fetching" })
  const sent = useRef(false)

  // Zeroed when the handover leaves the screen, not when it opens: every item
  // decrypts against its key while it is shown. A ref rather than a dependency
  // on `state`, so navigating away wipes the keys that are actually held.
  const held = useRef<Opened | null>(null)
  useEffect(() => {
    held.current = state.status === "open" ? state.handover : null
  }, [state])
  useEffect(() => () => wipeHandover(held.current), [])

  const load = useCallback(
    () =>
      openHandover({ deliveryId })
        .then((response) => setState({ status: "locked", response }))
        .catch(() => setState({ status: "failed" })),
    [openHandover, deliveryId]
  )

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    void load()
  }, [load])

  function retry() {
    setState({ status: "fetching" })
    void load()
  }

  if (state.status === "fetching") return <Placeholder label={common.loading} className="h-96" />

  if (state.status === "failed") {
    return (
      <NoticeCard
        icon={ShieldAlertIcon}
        tone="attention"
        title={labels.loadFailedTitle}
        body={labels.loadFailedBody}
        headingLevel="h1"
        action={
          <Button variant="outline" onClick={retry}>
            <RotateCwIcon className="size-4" strokeWidth={2.4} aria-hidden />
            {common.retry}
          </Button>
        }
      />
    )
  }

  if (state.status === "open") return <OpenedHandover handover={state.handover} />

  const { response } = state
  const sheets = sheetsOnRecord(response)

  if (response.items.length === 0) {
    return <NoticeCard icon={PackageXIcon} title={labels.emptyTitle} body={labels.emptyBody} headingLevel="h1" />
  }
  if (!sheets.executor && !sheets.recovery) {
    return <NoticeCard icon={LockKeyholeIcon} title={labels.sealedTitle} body={labels.sealedBody} headingLevel="h1" />
  }

  return (
    <SheetGate
      expiresAt={response.expiresAt}
      sheets={sheets}
      onSubmit={(code) => {
        const result = unlockHandover(response, code)
        if (result.status === "failed") return result.reason
        setState({ status: "open", handover: result.handover })
        return null
      }}
    />
  )
}

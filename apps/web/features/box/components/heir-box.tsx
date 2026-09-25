"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { useMutation } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { BoxGate } from "@/features/box/components/box-gate"
import { OpenedBox } from "@/features/box/components/opened-box"
import {
  openDeliveryResponse,
  wipeDelivery,
  type OpenedDelivery,
} from "@/features/box/lib/open-box"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

type BoxState =
  | { status: "locked" }
  | { status: "opening" }
  | { status: "open"; delivery: OpenedDelivery }
  | { status: "failed" }

/**
 * ٧.٦ — the heir's box: the gate, and what is behind it.
 *
 * Opening is one call: the release gate checks everything again and returns
 * this heir's items with their keys. The keys live exactly as long as this
 * component is mounted.
 */
export function HeirBox({
  deliveryId,
  expiresAt,
}: {
  deliveryId: Id<"deliveries">
  expiresAt: number
}) {
  const labels = t(HEIR_BOX, useLocale())
  const openDelivery = useMutation(api.escrow.openDelivery)
  const [state, setState] = useState<BoxState>({ status: "locked" })

  // Zeroed when the box leaves the screen, not when it opens: every item
  // decrypts against its key while it is shown. A ref rather than a dependency
  // on `state`, so navigating away wipes the keys that are actually held.
  const held = useRef<OpenedDelivery | null>(null)
  useEffect(() => {
    held.current = state.status === "open" ? state.delivery : null
  }, [state])
  useEffect(() => () => wipeDelivery(held.current), [])

  async function unlock() {
    setState({ status: "opening" })
    try {
      const response = await openDelivery({ deliveryId })
      setState({ status: "open", delivery: openDeliveryResponse(response) })
    } catch {
      setState({ status: "failed" })
    }
  }

  if (state.status === "open") {
    return <OpenedBox delivery={state.delivery} />
  }

  return (
    <BoxGate
      expiresAt={expiresAt}
      busy={state.status === "opening"}
      error={state.status === "failed" ? labels.failed : undefined}
      onUnlock={() => void unlock()}
    />
  )
}

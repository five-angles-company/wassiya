"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { useAction } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { BoxGate } from "@/features/box/components/box-gate"
import { OpenedBox } from "@/features/box/components/opened-box"
import {
  openDelivery,
  wipeKeyMap,
  type OpenedBundle,
} from "@/features/box/lib/open-box"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

type BoxState =
  | { status: "locked" }
  | { status: "opening" }
  | { status: "open"; bundle: OpenedBundle }
  | { status: "failed" }

/**
 * ٧.٦ — the heir's box: the gate, and what is behind it.
 *
 * K_h arrives sealed to a one-time key this page generates, and is opened and
 * zeroed in `openDelivery`; the DEKs it releases live exactly as long as this
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
  const unlockAction = useAction(api.escrow.openDelivery)
  const [state, setState] = useState<BoxState>({ status: "locked" })

  // The DEKs live for as long as the box is on screen — every row decrypts
  // against them — so they are zeroed when it leaves, not when it opens. A ref
  // rather than a dependency on `state`, so navigating away wipes the bundle
  // that is actually held.
  const held = useRef<OpenedBundle | null>(null)
  useEffect(() => {
    held.current = state.status === "open" ? state.bundle : null
  }, [state])
  useEffect(() => () => wipeKeyMap(held.current?.deks), [])

  async function unlock() {
    setState({ status: "opening" })
    try {
      const bundle = await openDelivery((browserPublicKey) =>
        unlockAction({ deliveryId, browserPublicKey })
      )
      setState({ status: "open", bundle })
    } catch {
      setState({ status: "failed" })
    }
  }

  if (state.status === "open") {
    return <OpenedBox deliveryId={deliveryId} bundle={state.bundle} expiresAt={expiresAt} />
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

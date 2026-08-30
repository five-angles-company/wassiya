"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@workspace/backend/api"
import { useMutation } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { BoxGate } from "@/features/box/components/box-gate"
import { OpenedBox } from "@/features/box/components/opened-box"
import {
  deriveHeirKey,
  openBundle,
  wipeKeyMap,
  type OpenedBundle,
} from "@/features/box/lib/open-box"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

type BoxState =
  | { status: "locked" }
  | { status: "opening" }
  | { status: "open"; bundle: OpenedBundle }
  | { status: "badShare" }
  | { status: "failed" }

/**
 * ٧.٦ — the heir's box: the gate, and what is behind it.
 *
 * This component holds one thing — the state of the two halves — and delegates
 * both faces of it. Everything below happens in the browser: the server never
 * sees K_h, either half of it, or any DEK it protects, which is the entire
 * point of having withheld one half.
 */
export function HeirBox({ claimId }: { claimId: string }) {
  const labels = t(HEIR_BOX, useLocale())
  const fetchBundle = useMutation(api.release.releasedBundleForHeir)
  const [share, setShare] = useState("")
  const [state, setState] = useState<BoxState>({ status: "locked" })

  // The DEKs live for as long as the box is on screen — every row decrypts
  // against them — so they are zeroed when it leaves, not when it opens. A ref
  // rather than a dependency on `state`, so navigating away wipes the bundle
  // that is actually held rather than whichever one the effect last closed over.
  const held = useRef<OpenedBundle | null>(null)
  useEffect(() => {
    held.current = state.status === "open" ? state.bundle : null
  }, [state])
  useEffect(() => () => wipeKeyMap(held.current?.deks), [])

  async function unlock() {
    setState({ status: "opening" })
    let kH: Uint8Array | undefined
    let guardianShare: Uint8Array | undefined
    try {
      const { bundleUrl, serverShare } = await fetchBundle({ claimId })
      if (bundleUrl === null) {
        setState({ status: "failed" })
        return
      }

      const derived = deriveHeirKey(serverShare, share)
      kH = derived.kH
      guardianShare = derived.guardianShare

      const blob = new Uint8Array(await (await fetch(bundleUrl)).arrayBuffer())
      setState({ status: "open", bundle: openBundle(blob, kH) })
    } catch (cause) {
      // A wrong half and a tampered bundle are indistinguishable here by
      // design — `open` throws identically for both. The message names the
      // recoverable one, because that is what it almost always is.
      setState(
        cause instanceof Error && /tag|decrypt|auth/i.test(cause.message)
          ? { status: "badShare" }
          : { status: "failed" }
      )
    } finally {
      // In `finally`, not at the end of `try`: a throw between deriving K_h and
      // opening the bundle would otherwise leave both halves sitting in memory
      // for the life of the page — which is the one case where it matters.
      //
      // The DEKs inside the opened bundle deliberately survive. They are what
      // every row on the screen decrypts against, and zeroing them here would
      // empty the box the instant it opened.
      kH?.fill(0)
      guardianShare?.fill(0)
    }
  }

  if (state.status === "open") {
    return <OpenedBox claimId={claimId} bundle={state.bundle} />
  }

  return (
    <BoxGate
      share={share}
      busy={state.status === "opening"}
      error={
        state.status === "badShare"
          ? labels.badShare
          : state.status === "failed"
            ? labels.failed
            : undefined
      }
      onShareChange={(value) => {
        setShare(value)
        if (state.status !== "locked") setState({ status: "locked" })
      }}
      onUnlock={() => void unlock()}
    />
  )
}

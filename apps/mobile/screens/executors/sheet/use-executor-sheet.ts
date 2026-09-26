/**
 * Mints an executor sheet — AGENTS.md "Handover".
 *
 * Mint → display → confirm → save, in that order. The sheet secret exists only
 * in this hook's state; the wrapper is saved by `activate`, which the screen
 * calls only after a print or save intent succeeded. Until then the previous
 * sheet keeps working, so abandoning this screen costs nothing.
 *
 * The version is decided here, before the wrapper exists, because it is bound
 * into the wrapper's AAD; `executors.saveSheet` refuses one that does not
 * follow the stored version.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { randomBytes } from "@workspace/crypto/bytes"
import { encodeExecutorCode } from "@workspace/crypto/papercode"
import { wrapReleaseKeyForExecutor } from "@workspace/crypto/release"

import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import { toArrayBuffer, useReleaseKey } from "@/lib/release-key"

export type ExecutorSheetMaterial = {
  groups: string[]
  version: number
}

export type ExecutorSheetState =
  | { status: "preparing" }
  | { status: "ready"; material: ExecutorSheetMaterial }
  | { status: "failed" }

export function useExecutorSheet(
  executor: { id: Id<"executors">; sheetVersion: number | null } | null,
  unlocked: boolean
): {
  state: ExecutorSheetState
  /** Stores the wrapper. Resolves false when it did not land. */
  activate: () => Promise<boolean>
} {
  const obtainReleaseKey = useReleaseKey()
  const saveSheet = useMutation(api.executors.saveSheet)
  const [state, setState] = useState<ExecutorSheetState>({ status: "preparing" })
  const wrapped = useRef<ArrayBuffer | null>(null)
  // Minting twice would show one code and store another.
  const started = useRef(false)

  useEffect(() => {
    if (executor === null || !unlocked || started.current) return
    started.current = true
    void (async () => {
      try {
        ensureWebCrypto()
        const { ownerId, releaseKey } = await obtainReleaseKey()
        const version = (executor.sheetVersion ?? 0) + 1
        const sheetSecret = randomBytes(32)
        try {
          wrapped.current = toArrayBuffer(
            wrapReleaseKeyForExecutor(releaseKey, sheetSecret, {
              ownerId,
              executorId: executor.id,
              sheetVersion: version,
            })
          )
          const code = encodeExecutorCode(sheetSecret, version)
          setState({ status: "ready", material: { groups: code.split("-"), version } })
        } finally {
          sheetSecret.fill(0)
          releaseKey.fill(0)
        }
      } catch {
        setState({ status: "failed" })
      }
    })()
  }, [executor, obtainReleaseKey, unlocked])

  const activate = useCallback(async () => {
    if (state.status !== "ready" || executor === null || wrapped.current === null) {
      return false
    }
    try {
      await saveSheet({
        executorId: executor.id,
        releaseKeyWrapped: wrapped.current,
        version: state.material.version,
      })
      return true
    } catch {
      return false
    }
  }, [executor, saveSheet, state])

  return { state, activate }
}

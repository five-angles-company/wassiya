/**
 * The submit half of a wizard: turn its answers into payloads, run
 * `useCreateAsset`, and own the submitting/error state so six screens do not
 * each re-invent it.
 *
 * Text secrets arrive as strings and become one encrypted blob; file-backed
 * types pass their bytes straight through. Either way the caller gets a boolean
 * and an error message it can render — never a thrown exception to catch, since
 * every wizard would handle it identically.
 */
import { useCallback, useRef, useState } from "react"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { utf8ToBytes } from "@workspace/crypto/bytes"
import type { AssetLabel } from "@workspace/crypto/label"
import type { Id } from "@workspace/backend/dataModel"

import type { UploadProgress } from "@/lib/asset-upload"
import type { AssetType } from "@/lib/asset-types"
import { usePaywall } from "@/components/paywall"
import { useStrings } from "@/i18n/use-strings"
import { limitBeforeUpload, planLimitOf } from "@/lib/plan-limit"
import {
  useCreateAsset,
  VaultLockedError,
  type AssetPayload,
} from "@/screens/assets/new/use-create-asset"

export type AssetSubmitInput = {
  type: AssetType
  label: AssetLabel
  /** A phrase, a password, a note body — encrypted as a single blob. */
  secret?: string
  /** Already-read plaintext file bytes, one blob each. */
  files?: AssetPayload[]
  meta?: {
    itemCount?: number
    byteSize?: number
    mimeType?: string
    expiryRemindAt?: number
  }
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
}

export type AssetSubmit = {
  /** The new asset's id, or `null` if it was not created. */
  submit: (input: AssetSubmitInput) => Promise<Id<"assets"> | null>
  submitting: boolean
  error: string | null
}

export function useAssetSubmit(): AssetSubmit {
  const { t } = useStrings("assets/new")
  const create = useCreateAsset()
  const paywall = usePaywall()
  // Same "skip" as the paywall's: `plans.current` calls `requireUser`, so a
  // session that lapses while a wizard is open would take the screen down with
  // a render-time error. Undefined is already the "checked on the server only"
  // path through `limitBeforeUpload`.
  const { isAuthenticated } = useConvexAuth()
  const plan = useQuery(api.plans.current, isAuthenticated ? {} : "skip")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A ref, not the state flag. `setSubmitting(true)` does not take effect until
  // the next render, so two taps in one tick would both read `false` and both
  // pass — encrypting and storing the whole asset twice under two DEKs. Same
  // reason the OTP screen guards its verify with a ref.
  const inFlight = useRef(false)

  const submit = useCallback(
    async ({ type, label, secret, files, meta, onProgress }: AssetSubmitInput) => {
      // `null`, not `false`: the id is the return value now, because the wizard
      // hands off to recipient selection for that asset and cannot ask for it
      // afterwards without a round trip.
      if (inFlight.current) return null
      inFlight.current = true
      setSubmitting(true)
      setError(null)

      try {
        // Checked here as well as on the server, because the server's refusal
        // arrives after an album has been encrypted and uploaded. Every number
        // compared came from `plans.current`, so this is the same rule read
        // early, not a second copy of it.
        const early = limitBeforeUpload(plan, {
          type,
          byteSize: meta?.byteSize ?? 0,
        })
        if (early !== null) {
          paywall.open(early)
          setError(t.quotaExceeded)
          return null
        }

        const payloads: AssetPayload[] = [
          ...(secret === undefined
            ? []
            : [{ read: () => Promise.resolve(utf8ToBytes(secret)) }]),
          ...(files ?? []),
        ]
        return await create({ type, label, payloads, meta, onProgress })
      } catch (cause) {
        // Three outcomes, three remedies. A plan limit and an auto-locked vault
        // are both normal events; collapsing them into "something went wrong"
        // would send an owner hunting for a fault that is not theirs.
        //
        // A limit opens the paywall rather than printing a line, because the
        // remedy is a purchase and the wizard has nowhere to put one. The line
        // is still set: the sheet can be dismissed, and a wizard that then
        // showed no reason for the failed save would be a dead end.
        const limit = planLimitOf(cause)
        if (limit !== null) {
          paywall.open(limit)
        }
        setError(
          cause instanceof VaultLockedError
            ? t.vaultLocked
            : limit !== null
              ? t.quotaExceeded
              : t.saveFailed
        )
        console.warn("[wassiya] asset create failed", cause)
        return null
      } finally {
        inFlight.current = false
        setSubmitting(false)
      }
    },
    [create, paywall, plan, t.quotaExceeded, t.saveFailed, t.vaultLocked]
  )

  return { submit, submitting, error }
}

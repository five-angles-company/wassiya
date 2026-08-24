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
import { utf8ToBytes } from "@workspace/crypto/bytes"
import type { AssetLabel } from "@workspace/crypto/label"

import type { UploadProgress } from "@/lib/asset-upload"
import type { AssetType } from "@/lib/asset-types"
import { useStrings } from "@/i18n/use-strings"
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
  submit: (input: AssetSubmitInput) => Promise<boolean>
  submitting: boolean
  error: string | null
}

export function useAssetSubmit(): AssetSubmit {
  const { t } = useStrings("assets/new")
  const create = useCreateAsset()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A ref, not the state flag. `setSubmitting(true)` does not take effect until
  // the next render, so two taps in one tick would both read `false` and both
  // pass — encrypting and storing the whole asset twice under two DEKs. Same
  // reason the OTP screen guards its verify with a ref.
  const inFlight = useRef(false)

  const submit = useCallback(
    async ({ type, label, secret, files, meta, onProgress }: AssetSubmitInput) => {
      if (inFlight.current) return false
      inFlight.current = true
      setSubmitting(true)
      setError(null)

      try {
        const payloads: AssetPayload[] = [
          ...(secret === undefined ? [] : [{ bytes: utf8ToBytes(secret) }]),
          ...(files ?? []),
        ]
        await create({ type, label, payloads, meta, onProgress })
        return true
      } catch (cause) {
        // The vault auto-locking mid-wizard is a normal event with its own
        // remedy, not a failure to report as "something went wrong".
        setError(cause instanceof VaultLockedError ? t.vaultLocked : t.saveFailed)
        console.warn("[wassiya] asset create failed", cause)
        return false
      } finally {
        inFlight.current = false
        setSubmitting(false)
      }
    },
    [create, t.saveFailed, t.vaultLocked]
  )

  return { submit, submitting, error }
}

/**
 * Opening an asset for editing: both tiers of decryption, and the way back.
 *
 * The label and the secret are sealed on the row itself, so the form prefills
 * without downloading anything; files are only ever fetched by the screen that
 * shows them. What replaces ٤.٩'s second gate is per-field masking, so
 * revealing a password does not put the 2FA note on screen beside it; the seed
 * phrase keeps a fingerprint on top because its disclosure is unrecoverable.
 *
 * `noteReveal` is wired to the eye, not to the screen opening. The screen
 * renders آخر فتح from `lastRevealedAt`, so recording on open would make that
 * row read "now" every time anyone checked it — destroying the only signal it
 * carries, that somebody *else* opened this asset. A ref collapses one visit
 * into one line.
 */
import { useCallback, useMemo, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { openLabel, type AssetLabel } from "@workspace/crypto/label"
import { openSecret } from "@workspace/crypto/secret"
import { unwrap } from "@workspace/crypto/wrap"

import type { UploadProgress } from "@/lib/asset-upload"
import type { EditSource } from "@/screens/assets/detail/forms/source"
import {
  type AssetMeta,
  type FileInput,
  useSaveAsset,
  VaultLockedError,
} from "@/screens/assets/use-save-asset"
import { useVault } from "@/stores/vault"

export type EditorLoad =
  | { status: "loading" }
  /** No key in memory — the vault closed under the screen. */
  | { status: "locked" }
  /** The secret did not open, or is not the format this type writes. */
  | { status: "unreadable"; title: string; subtitle: string }
  | ({ status: "ready" } & EditSource)

export type SaveError = "locked" | "failed"

export type SaveInput = {
  label: AssetLabel
  secret?: string
  /** The complete file list after this edit. Absent leaves the files as they are. */
  files?: FileInput[]
  meta?: AssetMeta
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
}

export function useAssetEditor(assetId: Id<"assets">) {
  const asset = useQuery(api.assets.get, { assetId })
  const mk = useVault((s) => s.mk)
  const recordReveal = useMutation(api.assets.recordReveal)
  const saveAsset = useSaveAsset()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<SaveError | null>(null)
  /** One audit line per visit, however many secrets get revealed on it. */
  const recorded = useRef(false)

  /** Hand to every secret field's `onReveal`. */
  const noteReveal = useCallback(() => {
    if (recorded.current) return
    recorded.current = true
    void recordReveal({ assetId })
  }, [assetId, recordReveal])

  const load = useMemo((): EditorLoad => {
    if (asset === undefined) return { status: "loading" }
    if (mk === null) return { status: "locked" }

    const dek = unwrap(new Uint8Array(asset.dekWrappedByMk), mk)
    try {
      // Tier one: the label. Opened first so a secret that fails still leaves
      // the owner on a screen that names what they were looking at.
      let label: AssetLabel | null = null
      try {
        label = openLabel(new Uint8Array(asset.labelSealed), dek)
      } catch {
        label = null
      }
      const title = label?.title ?? ""
      const subtitle = label?.subtitle ?? ""

      try {
        const secret =
          asset.secretSealed === null
            ? ""
            : openSecret(new Uint8Array(asset.secretSealed), dek)
        return {
          status: "ready",
          secret,
          title,
          subtitle,
          meta: asset.meta,
          files: asset.files,
        }
      } catch {
        return { status: "unreadable", title, subtitle }
      }
    } finally {
      dek.fill(0)
    }
  }, [asset, mk])

  const save = useCallback(
    async (input: SaveInput): Promise<boolean> => {
      if (asset === undefined) return false
      setSaving(true)
      setError(null)
      try {
        await saveAsset({
          existing: { assetId, dekWrappedByMk: asset.dekWrappedByMk },
          type: asset.type,
          ...input,
        })
        return true
      } catch (thrown) {
        setError(thrown instanceof VaultLockedError ? "locked" : "failed")
        return false
      } finally {
        setSaving(false)
      }
    },
    [asset, assetId, saveAsset]
  )

  return {
    asset,
    load,
    save,
    saving,
    error,
    noteReveal,
    clearError: () => setError(null),
  }
}

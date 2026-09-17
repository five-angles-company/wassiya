/**
 * Opening an asset for editing: both tiers of decryption, and the way back.
 *
 * The payload decrypts when the screen does — a form cannot prefill from a blob
 * it has not opened. What replaces ٤.٩'s second gate is per-field masking, so
 * revealing a password does not put the 2FA note on screen beside it; the seed
 * phrase keeps a fingerprint on top because its disclosure is unrecoverable.
 *
 * `noteReveal` is wired to the eye, not to the screen opening. The screen
 * renders آخر فتح from `lastRevealedAt`, so recording on open would make that
 * row read "now" every time anyone checked it — destroying the only signal it
 * carries, that somebody *else* opened this asset. A ref collapses one visit
 * into one line.
 *
 * Saving reuses the asset's DEK rather than rotating it, because heir bundles
 * carry the routed DEKs. See `use-update-asset.ts`.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { decryptAsset } from "@workspace/crypto/asset"
import { bytesToUtf8, utf8ToBytes } from "@workspace/crypto/bytes"
import { openLabel, type AssetLabel } from "@workspace/crypto/label"
import { unwrap } from "@workspace/crypto/wrap"

import { downloadCiphertext, type UploadProgress } from "@/lib/asset-upload"
import {
  VaultLockedError,
  type AssetPayload,
} from "@/screens/assets/new/use-create-asset"
import { useUpdateAsset } from "@/screens/assets/detail/use-update-asset"
import type { EditSource } from "@/screens/assets/detail/forms/source"
import { useVault } from "@/stores/vault"

export type EditorLoad =
  | { status: "loading" }
  /** No key in memory — the vault closed under the screen. */
  | { status: "locked" }
  /** The blob did not decrypt, or is not the format this type writes. */
  | { status: "unreadable"; title: string; subtitle: string }
  | ({ status: "ready" } & EditSource)

/** The half of {@link EditorLoad} that an async decryption actually produces. */
type Decrypted =
  | { status: "pending" }
  | { status: "unreadable"; title: string; subtitle: string }
  | ({ status: "ready" } & EditSource)

export type SaveError = "locked" | "failed"

export type SaveInput = {
  label: AssetLabel
  /** Encrypted as one blob and stored first. Absent for the file types. */
  secret?: string
  /** Already-read plaintext file bytes, one blob each, after the secret. */
  files?: AssetPayload[]
  /** Existing blobs that survive this edit, ahead of everything new. */
  keep?: Id<"_storage">[]
  /**
   * Compose the final `storageIds` from the ids just uploaded. Overrides
   * `keep`. ٤.٦ needs it: an album stores every original and then every
   * thumbnail, and `meta.itemCount` is the index where one ends and the other
   * begins — so appending new blobs to the end would put a thumbnail where an
   * original is expected and hand an heir a gallery of tiny pictures.
   */
  arrange?: (uploaded: Id<"_storage">[]) => Id<"_storage">[]
  meta?: { itemCount?: number; byteSize?: number; mimeType?: string }
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
}

export type EditorOptions = {
  /**
   * Download and decrypt `storageIds[0]` as text. **False for the file types**:
   * their first blob is a PDF or a JPEG, so decoding it as UTF-8 produces
   * nothing usable, and doing it anyway would pull a 25 MB document over the
   * wire every time the owner opened the screen to rename it.
   */
  payload?: boolean
}

export function useAssetEditor(
  assetId: Id<"assets">,
  { payload = true }: EditorOptions = {}
) {
  const asset = useQuery(api.assets.get, { assetId })
  const mk = useVault((s) => s.mk)
  const recordReveal = useMutation(api.assets.recordReveal)
  const updateAsset = useUpdateAsset()

  const [decrypted, setDecrypted] = useState<Decrypted>({ status: "pending" })
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

  useEffect(() => {
    if (asset === undefined || mk === null) return

    let live = true
    void (async () => {
      const dek = unwrap(new Uint8Array(asset.dekWrappedByMk), mk)
      try {
        // Tier one: the label. Opened first so a payload failure still leaves
        // the owner on a screen that names what they were looking at.
        let label: AssetLabel | null = null
        try {
          label = openLabel(new Uint8Array(asset.labelSealed), dek)
        } catch {
          label = null
        }
        const title = label?.title ?? ""
        const subtitle = label?.subtitle ?? ""

        const common = {
          title,
          subtitle,
          meta: asset.meta,
          storageIds: asset.storageIds as string[],
          urls: asset.urls,
        }

        if (!payload) {
          if (live) setDecrypted({ status: "ready", secret: "", ...common })
          return
        }

        const url = asset.urls[0] ?? null
        if (url === null) {
          if (live) setDecrypted({ status: "unreadable", title, subtitle })
          return
        }

        const secret = bytesToUtf8(
          decryptAsset(await downloadCiphertext(url), dek)
        )
        if (!live) return
        setDecrypted({ status: "ready", secret, ...common })
      } catch {
        if (live) {
          setDecrypted({ status: "unreadable", title: "", subtitle: "" })
        }
      } finally {
        dek.fill(0)
      }
    })()

    return () => {
      live = false
    }
  }, [asset, mk, payload])

  const load: EditorLoad =
    asset === undefined
      ? { status: "loading" }
      : mk === null
        ? { status: "locked" }
        : decrypted.status === "pending"
          ? { status: "loading" }
          : decrypted

  const save = useCallback(
    async (input: SaveInput): Promise<boolean> => {
      if (asset === undefined) return false
      setSaving(true)
      setError(null)
      try {
        await updateAsset({
          assetId,
          dekWrappedByMk: asset.dekWrappedByMk,
          label: input.label,
          // The secret leads, exactly as it does on create: `storageIds[0]` is
          // the payload blob for every type that has one, and the file types
          // have none, so a single ordering serves both.
          payloads: [
            ...(input.secret === undefined
              ? []
              : [
                  {
                    read: () => Promise.resolve(utf8ToBytes(input.secret!)),
                  },
                ]),
            ...(input.files ?? []),
          ],
          keep: input.keep,
          arrange: input.arrange,
          meta: input.meta,
          onProgress: input.onProgress,
        })
        return true
      } catch (thrown) {
        // Reuses the create path's error, rather than inventing a second name
        // for the same condition: the vault closed while the form was open.
        setError(thrown instanceof VaultLockedError ? "locked" : "failed")
        return false
      } finally {
        setSaving(false)
      }
    },
    [asset, assetId, updateAsset]
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

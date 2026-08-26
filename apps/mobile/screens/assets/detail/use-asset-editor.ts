/**
 * Opening an asset for editing: both tiers of decryption, and the way back.
 *
 * ## The second gate moved, it did not disappear
 *
 * ٤.٩ used to decrypt the label on open and hold the payload behind a fresh
 * biometric on a ten-second timer. That shape only works for a screen that
 * *displays* a secret. This screen edits one, and a form cannot be prefilled
 * from a blob it has not opened — so the payload decrypts when the screen does.
 *
 * What replaces the gate is per-field masking: `EditableRow` renders every
 * secret masked, with its own eye, so revealing a password does not put the
 * two-factor note and the recovery codes on screen beside it. The owner asks
 * for exactly the value they need, and the screenshot guard still covers all of
 * it. The seed phrase is the one value that keeps a fingerprint on top, because
 * it is the one whose disclosure is unrecoverable.
 *
 * ## The reveal is still recorded
 *
 * `recordReveal` fires once per successful open. Under the old model that was
 * "the owner peeked"; under this one, opening the screen genuinely is opening
 * the content, and the row on the screen is already labelled *آخر فتح*. A vault
 * whose contents can be read without leaving a trace cannot tell its owner
 * whether anyone else has read them, and moving the gate must not quietly cost
 * that. Guarded by a ref, so a re-render does not write a second line.
 *
 * ## Only the decryption is state
 *
 * "Still loading" and "the vault is locked" are facts about the query and the
 * key store, derived on every render. Mirroring them into state would mean an
 * effect that writes state synchronously — a cascading render, and a window in
 * which the hook reports a stale answer to a question it could have answered
 * directly.
 *
 * ## Saving does not rotate the DEK
 *
 * See `use-update-asset.ts`. Heir bundles carry the routed DEKs, so an edit
 * reuses the asset's own key rather than minting one.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { decryptAsset } from "@workspace/crypto/asset"
import { bytesToUtf8, utf8ToBytes } from "@workspace/crypto/bytes"
import { openLabel, type AssetLabel } from "@workspace/crypto/label"
import { unwrap } from "@workspace/crypto/wrap"

import { downloadCiphertext } from "@/lib/asset-upload"
import { VaultLockedError } from "@/screens/assets/new/use-create-asset"
import { useUpdateAsset } from "@/screens/assets/detail/use-update-asset"
import { useVault } from "@/stores/vault"

export type EditorLoad =
  | { status: "loading" }
  /** No key in memory — the vault closed under the screen. */
  | { status: "locked" }
  /** The blob did not decrypt, or is not the format this type writes. */
  | { status: "unreadable"; title: string; subtitle: string }
  | { status: "ready"; secret: string; title: string; subtitle: string }

/** The half of {@link EditorLoad} that an async decryption actually produces. */
type Decrypted =
  | { status: "pending" }
  | { status: "unreadable"; title: string; subtitle: string }
  | { status: "ready"; secret: string; title: string; subtitle: string }

export type SaveError = "locked" | "failed"

export function useAssetEditor(assetId: Id<"assets">) {
  const asset = useQuery(api.assets.get, { assetId })
  const mk = useVault((s) => s.mk)
  const recordReveal = useMutation(api.assets.recordReveal)
  const updateAsset = useUpdateAsset()

  const [decrypted, setDecrypted] = useState<Decrypted>({ status: "pending" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<SaveError | null>(null)
  /** One audit line per open, not one per render. */
  const recorded = useRef<string | null>(null)

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

        const url = asset.urls[0] ?? null
        if (url === null) {
          if (live) setDecrypted({ status: "unreadable", title, subtitle })
          return
        }

        const secret = bytesToUtf8(
          decryptAsset(await downloadCiphertext(url), dek)
        )
        if (!live) return

        if (recorded.current !== assetId) {
          recorded.current = assetId
          // Awaited before the payload reaches state, exactly as the reveal
          // flow did: the stamp is the owner's evidence that something *was*
          // opened, and evidence written before the open could succeed is
          // worth less than none.
          await recordReveal({ assetId })
        }
        if (live) setDecrypted({ status: "ready", secret, title, subtitle })
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
  }, [asset, mk, assetId, recordReveal])

  const load: EditorLoad =
    asset === undefined
      ? { status: "loading" }
      : mk === null
        ? { status: "locked" }
        : decrypted.status === "pending"
          ? { status: "loading" }
          : decrypted

  const save = useCallback(
    async (input: {
      secret: string
      label: AssetLabel
      meta?: { itemCount?: number; byteSize?: number; mimeType?: string }
    }): Promise<boolean> => {
      if (asset === undefined) return false
      setSaving(true)
      setError(null)
      try {
        await updateAsset({
          assetId,
          dekWrappedByMk: asset.dekWrappedByMk,
          label: input.label,
          payloads: [{ read: () => Promise.resolve(utf8ToBytes(input.secret)) }],
          meta: input.meta,
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

  return { asset, load, save, saving, error, clearError: () => setError(null) }
}

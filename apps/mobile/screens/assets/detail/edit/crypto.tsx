import { useCallback } from "react"
import type { Id } from "@workspace/backend/dataModel"
import { fmtNum } from "@workspace/ui-native/lib/format"
import * as LocalAuthentication from "expo-local-authentication"

import { useStrings } from "@/i18n/use-strings"
import { AssetEditFrame } from "@/screens/assets/detail/edit-frame"
import { CryptoFields } from "@/screens/assets/detail/forms/crypto-fields"
import {
  isCryptoValid,
  parseCrypto,
  toCryptoPayload,
} from "@/screens/assets/detail/forms/crypto"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"

/**
 * ٤.٣ — a crypto wallet, as the form that edits it.
 *
 * ## The one row that still costs a fingerprint
 *
 * `onRequestReveal` gates the seed phrase and nothing else. Every other secret
 * in this app is protected by masking plus the screenshot guard, which is
 * proportionate — a password that leaks can be rotated in an afternoon. A
 * phrase that leaks *is* the wallet, and with the vault now staying open for as
 * long as the app does, this prompt is the only thing between a found phone and
 * a drained one.
 *
 * `disableDeviceFallback: true`, deliberately: the vault's own unlock already
 * accepts a passcode, and a passcode is something a person holding the phone
 * may also know. This gate exists to prove a *person* is present.
 */
export function CryptoEditScreen({ assetId }: { assetId: Id<"assets"> }) {
  const { t, locale } = useStrings("assets/detail")
  const { t: crypto } = useStrings("assets/new/crypto")

  const { load, save, saving, error, noteReveal } = useAssetEditor(assetId)
  const source = load.status === "ready" ? load : null
  const { form, patch, dirty, commit, reset } = useEditForm(source, parseCrypto)

  const requestReveal = useCallback(async () => {
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: t.biometricPrompt!,
      disableDeviceFallback: true,
    })
    return auth.success
  }, [t.biometricPrompt])

  async function onSave() {
    if (form === null || source === null) return
    const payload = toCryptoPayload(
      form,
      source,
      crypto,
      (n) => fmtNum(n, locale),
      locale === "ar" ? "كلمة" : "words"
    )
    if (await save(payload)) commit()
  }

  return (
    <AssetEditFrame
      assetId={assetId}
      load={load}
      saving={saving}
      error={error}
      dirty={dirty}
      canSave={form !== null && dirty && isCryptoValid(form) && !saving}
      onSave={() => void onSave()}
      onCancel={reset}
      kindLine={crypto.title!}
    >
      {form === null ? null : (
        <CryptoFields
          value={form}
          onChange={patch}
          labels={t}
          crypto={crypto}
          locale={locale}
          onReveal={noteReveal}
          onRequestReveal={requestReveal}
        />
      )}
    </AssetEditFrame>
  )
}

/**
 * ٤.٣ — the crypto wallet. The board calls it "the hard screen".
 *
 * What makes it hard is not the form, it is the guarantee underneath it: a seed
 * phrase saved here is the only copy an heir will ever get, and nobody will be
 * able to ask whether it was typed correctly. So the BIP-39 checksum is
 * verified **on this device, before anything is saved**, and a phrase that
 * fails cannot be stored — see `@workspace/crypto/mnemonic`.
 *
 * The three protections named in the safety chips are all real and all
 * elsewhere: screenshots via `useSecureScreen`, keyboard learning via
 * `SECRET_INPUT_PROPS`, clipboard wiping via `useSecretPaste`. They are chips
 * on screen because a protection the user cannot see is one they cannot rely on.
 *
 * ## Two payloads, one screen
 *
 * Picking "منصة" switches the form. An exchange-held wallet has no seed phrase
 * — the account is the custody — so the phrase field, the pills and the BIP-39
 * gate all go away and credentials take their place. Without that branch the
 * checksum would refuse to let an exchange user save anything at all, which is
 * the failure the board's "exchange credentials variant" exists to prevent.
 */
import { useMemo, useRef, useState } from "react"
import { Text } from "@workspace/ui-native/components/ui/text"
import { GuardedSecretField } from "@workspace/ui-native/components/wassiya/guarded-secret-field"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { checkMnemonic } from "@workspace/crypto/mnemonic"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { router } from "expo-router"
import { View } from "react-native"

import { Field } from "@/components/field"
import { useSecretPaste } from "@/hooks/use-secret-paste"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { SECRET_INPUT_PROPS } from "@/lib/secret-input-props"
import { ExchangeFields, type ExchangeCredentials } from "@/screens/assets/new/crypto/components/exchange-fields"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { QrScanSheet } from "@/screens/assets/new/components/qr-scan-sheet"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

const NETWORKS = ["Bitcoin", "Ethereum", "Solana", "Tron", "BNB", "Other"]

export function NewCryptoScreen() {
  const { t, locale } = useStrings("assets/new/crypto")
  const { t: chrome } = useStrings("assets/new")
  useSecureScreen("assets/new/crypto")
  const paste = useSecretPaste()
  const { submit, submitting, error } = useAssetSubmit()

  const [name, setName] = useState("")
  const [network, setNetwork] = useState(NETWORKS[0]!)
  const [kind, setKind] = useState("hardware")
  const [phrase, setPhrase] = useState("")
  const [exchange, setExchange] = useState<ExchangeCredentials>({
    account: "",
    password: "",
    twoFactor: "",
  })
  const [notice, setNotice] = useState<string | null>(null)
  const qrSheet = useRef<TrueSheet>(null)

  const isExchange = kind === "exchange"

  // Memoised on the phrase: this runs a wordlist lookup per word and the
  // screen re-renders on every character typed.
  const check = useMemo(() => checkMnemonic(phrase), [phrase])
  const words = check.words
  const valid = check.status === "valid"

  /**
   * A scanned QR is only accepted if it *is* a phrase. Backup cards hold all
   * sorts of payloads, and silently pasting a non-phrase into the field would
   * hand the checksum a string it can only reject with a confusing message.
   */
  async function onScanned(value: string) {
    await qrSheet.current?.dismiss()
    if (checkMnemonic(value).status !== "valid") {
      setNotice(t.scanNotAPhrase)
      return
    }
    setNotice(null)
    setPhrase(value)
  }

  async function onPaste() {
    const { text } = await paste()
    if (text === null) {
      setNotice(t.pasteEmpty)
      return
    }
    setNotice(null)
    setPhrase(text)
  }

  async function save() {
    // Belt and braces: the button is already disabled unless the payload is
    // complete, but this is the one call site where an invalid phrase reaching
    // storage is unrecoverable, so the guard is repeated where the write happens.
    if (!isExchange && !valid) return

    const saved = await submit({
      type: "crypto",
      label: {
        title: name.trim(),
        subtitle: isExchange
          ? `${t.kindExchange} · ${network}`
          : `${t.secretLabel} · ${network} · ${fmtNum(words.length, locale)} ${WORD_UNIT[locale]}`,
      },
      secret: isExchange
        ? JSON.stringify({ kind, network, ...exchange })
        : // The canonical single-spaced phrase, not what was typed — the
          // checksum was verified against exactly these words.
          words.join(" "),
      meta: isExchange ? {} : { itemCount: words.length },
    })
    if (saved) router.back()
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={
        name.trim().length > 0 &&
        (isExchange
          ? exchange.account.trim().length > 0 && exchange.password.length > 0
          : valid)
      }
      submitting={submitting}
      onSubmit={() => void save()}
    >
      <View className="gap-4">
        <Field
          label={t.nameLabel}
          placeholder={t.namePlaceholder}
          value={name}
          onChangeText={setName}
        />

        <OptionChips
          label={t.networkLabel}
          options={NETWORKS.map((n) => ({ value: n, label: n }))}
          value={network}
          onChange={setNetwork}
        />

        <OptionChips
          label={t.kindLabel}
          options={[
            { value: "hardware", label: t.kindHardware },
            { value: "software", label: t.kindSoftware },
            { value: "exchange", label: t.kindExchange },
          ]}
          value={kind}
          onChange={setKind}
        />

        {isExchange ? (
          <ExchangeFields
            value={exchange}
            onChange={(patch) => setExchange((c) => ({ ...c, ...patch }))}
            labels={t}
          />
        ) : (
          <>
        <Field
          {...SECRET_INPUT_PROPS}
          label={t.secretLabel}
          value={phrase}
          onChangeText={(value) => {
            setPhrase(value)
            setNotice(null)
          }}
          multiline
          className="h-auto min-h-24 py-3"
          error={notice ?? checksumError(check, t, locale)}
        />

        {/* The review surface: masked pills, a gated 10s peek, and the chips.
            Rendered below the input rather than replacing it, because a phrase
            still being typed needs a cursor and a finished one needs a check. */}
        <GuardedSecretField
          title={t.secretLabel}
          wordCount={words.length}
          words={words}
          locale={locale}
          revealSeconds={10}
          onPaste={() => void onPaste()}
          onScanQr={() => void qrSheet.current?.present()}
          safetyChips={[t.chipScreenshot, t.chipKeyboard, t.chipClipboard]}
          // The primitive owns the wording and takes only the verdict; our
          // copy is threaded through `labels` so the counted "١٢ كلمة صحيحة"
          // phrasing stays in the catalogue rather than inside the component.
          checksum={
            words.length === 0 ? "unknown" : valid ? "valid" : "invalid"
          }
          labels={{
            checksumValid: t.checksumValid,
            checksumInvalid: t.checksumBad,
          }}
        />
          </>
        )}

        <Text variant="metaSm" className="text-muted-foreground leading-[1.7]">
          {chrome.encryptNote}
        </Text>

        {error !== null ? (
          <Text variant="meta" className="text-terracotta-800">
            {error}
          </Text>
        ) : null}

        <QrScanSheet
          ref={qrSheet}
          labels={t}
          onScanned={(value) => void onScanned(value)}
        />
      </View>
    </WizardFrame>
  )
}

/** "كلمة" / "words", for the row subtitle. */
const WORD_UNIT = { ar: "كلمة", en: "words" } as const

/**
 * Turn a failed check into the most actionable sentence available. Order
 * matters: naming the three misspelled words beats reporting a word count, and
 * both beat "checksum invalid", which tells a user nothing they can fix.
 */
function checksumError(
  check: ReturnType<typeof checkMnemonic>,
  t: Record<string, string>,
  locale: "ar" | "en"
): string | undefined {
  switch (check.status) {
    case "valid":
      return undefined
    case "unknownWords":
      return t.checksumUnknownWords!.replace(
        "{words}",
        check.unknown.slice(0, 3).join("، ")
      )
    case "badLength":
      // An empty field is not yet a mistake — say nothing until they start.
      return check.count === 0
        ? undefined
        : t.checksumLength!.replace("{n}", fmtNum(check.count, locale))
    case "badChecksum":
      return t.checksumBad
  }
}

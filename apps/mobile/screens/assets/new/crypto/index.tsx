/**
 * ٤.٣ — a crypto wallet. The highest-stakes input in the product.
 *
 * The seed grid is the only enclosed thing on the screen, so the one 24px
 * surface reads as the vault-within-the-vault without copy saying so. Word
 * pills keep their index because an heir reads the phrase back in order into a
 * wallet that rejects the lot if any position is wrong.
 *
 * The checksum is verified on device on every change, and an invalid phrase
 * cannot be saved: a phrase that reaches storage broken is unrecoverable, and
 * the owner is the only person who can still fix it at this moment.
 *
 * An exchange has no phrase — the account is the custody — so "منصة" swaps the
 * grid for login fields.
 */
import { useMemo, useRef, useState } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { checkMnemonic } from "@workspace/crypto/mnemonic"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChipRow } from "@workspace/ui-native/components/wassiya/chip-row"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { FieldValue } from "@workspace/ui-native/components/wassiya/field-value"
import { SeedGrid } from "@workspace/ui-native/components/wassiya/seed-grid"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { monoFont } from "@workspace/ui-native/lib/fonts"
import { cn } from "@workspace/ui-native/lib/utils"
import { Check, ClipboardPaste, QrCode } from "lucide-react-native"
import { router } from "expo-router"
import { Pressable, TextInput, View } from "react-native"

import { useSecretPaste } from "@/hooks/use-secret-paste"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { QrScanSheet } from "@/screens/assets/new/components/qr-scan-sheet"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"
import { ExchangeFields } from "@/screens/assets/new/crypto/components/exchange-fields"
import { NETWORKS } from "@/screens/assets/detail/forms/crypto"

export function NewCryptoScreen() {
  const { t, locale } = useStrings("assets/new/crypto")
  useSecureScreen("assets/new/crypto")
  const paste = useSecretPaste()
  const { submit, submitting, error } = useAssetSubmit()

  const [name, setName] = useState("")
  const [network, setNetwork] = useState(NETWORKS[0]!)
  const [kind, setKind] = useState("hardware")
  const [phrase, setPhrase] = useState("")
  const [exchange, setExchange] = useState({
    account: "",
    password: "",
    twoFactor: "",
  })
  const [notice, setNotice] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)
  const qrSheet = useRef<TrueSheet>(null)

  const check = useMemo(() => checkMnemonic(phrase), [phrase])
  const words = check.words
  const valid = check.status === "valid"
  const isExchange = kind === "exchange"
  const num = (n: number) => fmtNum(n, locale)

  async function save() {
    if (!isExchange && !valid) return
    const saved = await submit({
      type: "crypto",
      label: {
        title: name.trim(),
        subtitle: isExchange
          ? `${t.kindExchange} · ${network}`
          : `${t.secretLabel} · ${network} · ${num(words.length)} ${WORD_UNIT[locale]}`,
      },
      secret: JSON.stringify(
        isExchange
          ? { kind, network, ...exchange }
          : // The canonical single-spaced phrase, not what was typed — the
            // checksum was verified against exactly these words.
            { kind, network, phrase: words.join(" ") }
      ),
      meta: isExchange ? {} : { itemCount: words.length },
    })
    if (saved) {
      router.replace({
        pathname: "/assets/[id]/recipients",
        params: { id: saved, step: "2" },
      })
    }
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
      <View className="mb-5">
        <FieldRow label={t.nameLabel!} divider>
          <FieldValue
            value={name}
            onChangeText={setName}
            placeholder={t.namePlaceholder}
          />
        </FieldRow>

        <View className="py-[13px]">
          <Text className="mb-2 text-[12px] opacity-50">{t.networkLabel}</Text>
          <ChipRow
            options={NETWORKS.map((n) => ({ value: n, label: n }))}
            value={network}
            onChange={setNetwork}
          />
        </View>
        <View className="bg-border h-px" />

        <View className="py-[13px]">
          <Text className="mb-2 text-[12px] opacity-50">{t.kindLabel}</Text>
          <ChipRow
            options={[
              { value: "hardware", label: t.kindHardware! },
              { value: "software", label: t.kindSoftware! },
              { value: "exchange", label: t.kindExchange! },
            ]}
            value={kind}
            onChange={setKind}
          />
        </View>
      </View>

      {isExchange ? (
        <View className="mb-auto">
          <ExchangeFields
            value={exchange}
            onChange={(patch) => setExchange((c) => ({ ...c, ...patch }))}
            labels={t}
          />
        </View>
      ) : (
        <>
          <View className="mb-2.5 flex-row items-baseline gap-[9px]">
            <Text className="flex-1 text-[12px] opacity-50">{t.secretLabel}</Text>
            <Text className="text-[12px] opacity-50">
              {`${num(words.length)} ${WORD_UNIT[locale]}`}
            </Text>
          </View>

          {/* Pills once it parses, a field while it is being written. Tapping
              the grid goes back to the field — the words are the value, and
              there is no separate "edit" for them. */}
          {words.length > 0 && !typing ? (
            <Pressable onPress={() => setTyping(true)} accessibilityRole="button">
              <SeedGrid words={words} formatIndex={num} className="mb-[11px]" />
            </Pressable>
          ) : (
            <View className="rounded-[24px] bg-card mb-[11px] p-[15px]">
              <TextInput
                autoFocus={typing}
                value={phrase}
                onChangeText={setPhrase}
                onBlur={() => setTyping(false)}
                placeholder={t.secretPlaceholder}
                placeholderTextColor="#82796a"
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="off"
                importantForAutofill="no"
                textContentType="none"
                className={cn(
                  monoFont,
                  "text-foreground min-h-24 p-0 text-[13px] leading-[1.9]"
                )}
                style={{ writingDirection: "ltr" }}
              />
            </View>
          )}

          <View
            className={cn(
              "mb-4 flex-row items-center gap-2",
              valid ? "text-olive-700" : undefined
            )}
          >
            {valid ? (
              <Icon
                as={Check}
                size={15}
                strokeWidth={2.75}
                className="text-olive-700 shrink-0"
              />
            ) : null}
            <Text
              className={cn(
                "flex-1 text-[12.5px] leading-[1.6]",
                valid ? "text-olive-700" : "text-terracotta-800"
              )}
            >
              {valid
                ? `${num(words.length)} ${t.validWords} · ${t.checksumMatches}`
                : (notice ?? checksumError(check, t, num))}
            </Text>
          </View>

          <View className="mb-auto flex-row gap-[9px]">
            <Pressable
              accessibilityRole="button"
              onPress={() => void onPaste()}
              className="bg-card h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-full active:opacity-80"
            >
              <Icon as={ClipboardPaste} size={16} strokeWidth={2.75} className="text-foreground" />
              <Text className="text-[13.5px]">{t.paste}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void qrSheet.current?.present()}
              className="bg-card h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-full active:opacity-80"
            >
              <Icon as={QrCode} size={16} strokeWidth={2.75} className="text-foreground" />
              <Text className="text-[13.5px]">{t.scanShort}</Text>
            </Pressable>
          </View>

          {/* One line, not three chips. They reassure; they do not shout. */}
          <Text className="mt-[18px] text-[11px] leading-[1.7] opacity-45">
            {`${t.chipClipboard} · ${t.chipKeyboard} · ${t.chipScreenshot}`}
          </Text>
        </>
      )}

      {error !== null ? (
        <Text variant="meta" className="text-terracotta-800 mt-3">
          {error}
        </Text>
      ) : null}

      <QrScanSheet
        ref={qrSheet}
        labels={t}
        onScanned={(value) => {
          if (checkMnemonic(value).status !== "valid") {
            setNotice(t.scanNotAPhrase!)
            return
          }
          setNotice(null)
          setPhrase(value)
        }}
      />
    </WizardFrame>
  )

  async function onPaste() {
    const { text } = await paste()
    if (text === null) {
      setNotice(t.pasteEmpty!)
      return
    }
    setNotice(null)
    setPhrase(text)
  }
}

const WORD_UNIT = { ar: "كلمة", en: "words" } as const

/**
 * Turn a failed check into the most actionable sentence available. Order
 * matters: naming the three misspelled words beats reporting a word count, and
 * both beat "checksum invalid", which tells someone nothing they can fix.
 */
function checksumError(
  check: ReturnType<typeof checkMnemonic>,
  t: Record<string, string>,
  num: (n: number) => string
): string {
  switch (check.status) {
    case "valid":
      return ""
    case "unknownWords":
      return t.checksumUnknownWords!.replace(
        "{words}",
        check.unknown.slice(0, 3).join("، ")
      )
    case "badLength":
      // An empty field is not yet a mistake — say nothing until they start.
      return check.count === 0
        ? ""
        : t.checksumLength!.replace("{n}", num(check.count))
    case "badChecksum":
      return t.checksumBad!
  }
}

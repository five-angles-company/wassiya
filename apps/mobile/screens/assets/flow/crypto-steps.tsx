/**
 * ٤.٣ — a crypto wallet, as steps: what it is (kind, name, network), the secret,
 * and for a hardware wallet where the device is.
 *
 * - **The checksum gates the phrase step.** A phrase that reaches storage
 *   broken is unrecoverable, and the owner is the only person who can still
 *   fix it at this moment.
 * - **An exchange has no phrase** — the account is the custody — so its secret
 *   step asks for the login instead, and the BIP-39 gate does not apply.
 * - **The phrase step is guarded** when editing a saved wallet: showing the
 *   phrase costs a fingerprint.
 */
import { useMemo, useRef, useState } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { checkMnemonic } from "@workspace/crypto/mnemonic"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { NATIVE_COLOR } from "@workspace/ui-native/lib/native-colors"
import { ChipRow } from "@workspace/ui-native/components/wassiya/chip-row"
import { SeedGrid } from "@workspace/ui-native/components/wassiya/seed-grid"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { monoFont } from "@workspace/ui-native/lib/fonts"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { cn } from "@workspace/ui-native/lib/utils"
import {
  Check,
  ClipboardPaste,
  HardDrive,
  Landmark,
  QrCode,
  Smartphone,
} from "lucide-react-native"
import { Pressable, TextInput, View } from "react-native"

import { Field } from "@/components/field"
import { SecretField } from "@/components/secret-field"
import { useSecretPaste } from "@/hooks/use-secret-paste"
import { useStrings } from "@/i18n/use-strings"
import { SECRET_INPUT_PROPS } from "@/lib/secret-input-props"
import {
  isExchange,
  NETWORKS,
  type CryptoForm,
} from "@/screens/assets/detail/forms/crypto"
import { ChoiceCards } from "@/screens/assets/flow/choice-cards"
import type { AssetSection, FlowStep } from "@/screens/assets/flow/types"
import { QrScanSheet } from "@/screens/assets/new/components/qr-scan-sheet"

export const EMPTY_CRYPTO: CryptoForm = {
  name: "",
  network: NETWORKS[0]!,
  kind: "",
  phrase: "",
  devicePassword: "",
  deviceLocation: "",
  account: "",
  password: "",
  twoFactor: "",
}

const WORD_UNIT = { ar: "كلمة", en: "words" } as const

export function useCryptoSteps(
  form: CryptoForm,
  patch: (fields: Partial<CryptoForm>) => void,
  options: {
    /** A saved wallet keeps its kind: switching to an exchange drops the phrase. */
    editing: boolean
    onReveal?: () => void
  }
): FlowStep[] {
  const { editing, onReveal } = options
  const { t, locale } = useStrings("assets/new/crypto")
  const { t: detail } = useStrings("assets/detail")
  const paste = useSecretPaste()
  const qrSheet = useRef<TrueSheet>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)

  const check = useMemo(() => checkMnemonic(form.phrase), [form.phrase])
  const valid = check.status === "valid"
  const num = (n: number) => fmtNum(n, locale)

  async function onPaste() {
    const { text } = await paste()
    if (text === null) {
      setNotice(t.pasteEmpty!)
      return
    }
    setNotice(null)
    patch({ phrase: text })
  }

  const basics: FlowStep = {
    key: "basics",
    question: t.qWallet!,
    hint: editing ? undefined : t.hKind,
    blocked:
      !editing && form.kind === ""
        ? t.needsKind!
        : form.name.trim().length === 0
          ? t.needsName!
          : null,
    content: (
      <View className="gap-5">
        {editing ? null : (
          <ChoiceCards
            options={[
              { value: "hardware", title: t.kindHardware!, detail: t.kindHardwareDetail, icon: HardDrive },
              { value: "software", title: t.kindSoftware!, detail: t.kindSoftwareDetail, icon: Smartphone },
              { value: "exchange", title: t.kindExchange!, detail: t.kindExchangeDetail, icon: Landmark },
            ]}
            value={form.kind === "" ? null : form.kind}
            onChange={(value) => patch({ kind: value })}
          />
        )}
        <Field
          label={isExchange(form) ? t.exchangeName! : t.nameLabel!}
          placeholder={isExchange(form) ? t.exchangeNamePlaceholder : t.namePlaceholder}
          value={form.name}
          onChangeText={(name) => patch({ name })}
        />
        <View className="gap-2">
          <Text variant="meta" className="text-muted-foreground">
            {t.networkLabel}
          </Text>
          <ChipRow
            options={NETWORKS.map((n) => ({ value: n, label: n }))}
            value={form.network}
            onChange={(network) => patch({ network })}
          />
        </View>
      </View>
    ),
  }

  const exchange: FlowStep = {
    key: "secret",
    question: t.qExchange!,
    blocked:
      form.account.trim().length > 0 && form.password.length > 0 ? null : t.needsLogin!,
    content: (
      <View className="gap-4">
        <Field
          label={t.exchangeAccount!}
          placeholder={t.exchangeAccountPlaceholder}
          value={form.account}
          onChangeText={(account) => patch({ account })}
          autoCapitalize="none"
          keyboardType="email-address"
          className="text-left"
        />
        <SecretField
          label={t.exchangePassword!}
          value={form.password}
          onChangeText={(password) => patch({ password })}
          revealLabel={detail.revealShort!}
          onReveal={onReveal}
        />
        {/* Unmasked on purpose: where the second factor lives is the useful
            part, and a code would have rotated. */}
        <Field
          {...SECRET_INPUT_PROPS}
          label={t.exchangeTwoFactor!}
          placeholder={t.exchangeTwoFactorPlaceholder}
          value={form.twoFactor}
          onChangeText={(twoFactor) => patch({ twoFactor })}
          multiline
          className="h-auto min-h-20 py-3"
        />
        <Text variant="footnote">{t.exchangeNote}</Text>
      </View>
    ),
  }

  const phrase: FlowStep = {
    key: "secret",
    question: t.qPhrase!,
    hint: t.hPhrase,
    guarded: true,
    blocked: valid ? null : t.needsPhrase!,
    content: (
      <View className="gap-3">
        <View className="flex-row items-baseline">
          <Text variant="meta" className="flex-1 text-muted-foreground">
            {t.secretLabel}
          </Text>
          <Text variant="meta" className="text-muted-foreground">
            {`${num(check.words.length)} ${WORD_UNIT[locale]}`}
          </Text>
        </View>

        {/* Pills once it parses, a field while it is being written. Tapping
            the pills goes back to the field. */}
        {check.words.length > 0 && !typing ? (
          <Pressable onPress={() => setTyping(true)} accessibilityRole="button">
            <SeedGrid words={check.words} formatIndex={num} />
          </Pressable>
        ) : (
          <View className="rounded-box border-border bg-card border p-4">
            <TextInput
              {...SECRET_INPUT_PROPS}
              autoFocus={typing}
              value={form.phrase}
              onChangeText={(value) => patch({ phrase: value })}
              onBlur={() => setTyping(false)}
              placeholder={t.secretPlaceholder}
              placeholderTextColor={NATIVE_COLOR.mutedForeground}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              className={cn(monoFont, "text-foreground min-h-28 p-0 text-[14px] leading-[1.9]")}
              style={{ writingDirection: "ltr" }}
            />
          </View>
        )}

        <View className="flex-row items-center gap-2">
          {valid ? (
            <Icon as={Check} size={15} strokeWidth={2.75} className="text-olive-700 shrink-0" />
          ) : null}
          <Text
            className={cn(
              "flex-1 text-[12.5px] leading-[1.6]",
              valid ? "text-olive-700" : "text-terracotta-800"
            )}
          >
            {valid
              ? `${num(check.words.length)} ${t.validWords} · ${t.checksumMatches}`
              : (notice ?? checksumError(check, t, num))}
          </Text>
        </View>

        <View className="flex-row gap-2.5">
          <Pressable
            accessibilityRole="button"
            onPress={() => void onPaste()}
            className="bg-card h-11.5 flex-1 flex-row items-center justify-center gap-2 rounded-full active:opacity-80"
          >
            <Icon as={ClipboardPaste} size={16} strokeWidth={2.75} className="text-foreground" />
            <Text className="text-[13.5px]">{t.paste}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void qrSheet.current?.present()}
            className="bg-card h-11.5 flex-1 flex-row items-center justify-center gap-2 rounded-full active:opacity-80"
          >
            <Icon as={QrCode} size={16} strokeWidth={2.75} className="text-foreground" />
            <Text className="text-[13.5px]">{t.scanShort}</Text>
          </Pressable>
        </View>

        <Text variant="footnote" className="mt-2">
          {`${t.chipClipboard} · ${t.chipKeyboard} · ${t.chipScreenshot}`}
        </Text>

        <QrScanSheet
          ref={qrSheet}
          labels={t}
          onScanned={(value) => {
            if (checkMnemonic(value).status !== "valid") {
              setNotice(t.scanNotAPhrase!)
              return
            }
            setNotice(null)
            patch({ phrase: value })
          }}
        />
      </View>
    ),
  }

  const device: FlowStep = {
    key: "device",
    question: t.qDevice!,
    hint: t.hDevice,
    optional: true,
    blocked: null,
    content: (
      <View className="gap-4">
        <Field
          label={detail.fieldDeviceLocation!}
          placeholder={detail.deviceLocationPlaceholder}
          value={form.deviceLocation}
          onChangeText={(deviceLocation) => patch({ deviceLocation })}
          multiline
          className="h-auto min-h-20 py-3"
        />
        <SecretField
          label={detail.fieldDevicePassword!}
          value={form.devicePassword}
          onChangeText={(devicePassword) => patch({ devicePassword })}
          revealLabel={detail.revealShort!}
          onReveal={onReveal}
        />
      </View>
    ),
  }

  return [
    basics,
    isExchange(form) ? exchange : phrase,
    ...(form.kind === "hardware" ? [device] : []),
  ]
}

/** The asset page's cards. Never the phrase or a password — only that they exist. */
export function cryptoSections(
  form: CryptoForm,
  t: Record<string, string>,
  locale: Locale
): AssetSection[] {
  const kindLabel =
    { hardware: t.kindHardware, software: t.kindSoftware, exchange: t.kindExchange }[
      form.kind
    ] ?? ""
  const basics: AssetSection = {
    step: "basics",
    label: t.sectionBasics!,
    value: [kindLabel, form.network].filter((part) => part.length > 0).join(" · "),
  }

  if (isExchange(form)) {
    return [
      basics,
      {
        step: "secret",
        label: t.sectionExchange!,
        value: t.loginSummary!.replace("{account}", form.account),
        secret: true,
      },
    ]
  }

  const words = checkMnemonic(form.phrase).words.length
  return [
    basics,
    {
      step: "secret",
      label: t.sectionPhrase!,
      value: t.phraseSummary!.replace("{n}", fmtNum(words, locale)),
      secret: true,
    },
    ...(form.kind === "hardware"
      ? [
          {
            step: "device",
            label: t.sectionDevice!,
            value:
              form.deviceLocation.trim().length > 0
                ? form.deviceLocation.trim()
                : t.deviceNotRecorded!,
            empty: form.deviceLocation.trim().length === 0,
          },
        ]
      : []),
  ]
}

/**
 * The most actionable sentence available. Naming the misspelled words beats a
 * word count, and both beat "checksum invalid", which tells nobody what to fix.
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
      return t.checksumUnknownWords!.replace("{words}", check.unknown.slice(0, 3).join("، "))
    case "badLength":
      // An empty field is not yet a mistake.
      return check.count === 0 ? "" : t.checksumLength!.replace("{n}", num(check.count))
    case "badChecksum":
      return t.checksumBad!
  }
}

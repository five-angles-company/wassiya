/**
 * ٤.٧ — a digital account.
 *
 * ## The disposition is the point of this screen
 *
 * *"Most heirs don't want the account, they want it closed; make the choice
 * explicit at capture time rather than guessing at release."* So it is a list
 * of radio rows with a sentence each, not chips — these are three different
 * instructions to a grieving person, and each earns its explanation.
 *
 * Nothing is pre-selected and the button says why it is dead. A default would
 * quietly decide something people feel strongly about, and "delete" chosen by
 * accident cannot be undone.
 *
 * ## The two-factor field is free text and deliberately unmasked
 *
 * A rotating six-digit code is worthless to an heir; *where the second factor
 * lives* is everything. "SMS to my phone, backup codes in the where-things-are
 * note" is the answer that gets someone in, and masking it would hide the only
 * useful part while protecting nothing.
 *
 * Password and recovery codes get the same treatment as ٤.٣'s phrase:
 * screenshots blocked, keyboard learning off, clipboard wiped after paste.
 */
import { useState } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { FieldValue } from "@workspace/ui-native/components/wassiya/field-value"
import { RadioRow } from "@workspace/ui-native/components/wassiya/radio-row"
import { SecretValue } from "@workspace/ui-native/components/wassiya/secret-value"
import { monoFont } from "@workspace/ui-native/lib/fonts"
import { cn } from "@workspace/ui-native/lib/utils"
import { Eye, EyeOff } from "lucide-react-native"
import { router } from "expo-router"
import { Pressable, View } from "react-native"

import { useSecretPaste } from "@/hooks/use-secret-paste"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"
import {
  DISPOSITIONS,
  toDigitalPayload,
  type Disposition,
} from "@/screens/assets/detail/forms/digital"

export function NewAccountScreen() {
  const { t } = useStrings("assets/new/account")
  const { t: detail } = useStrings("assets/detail")
  const { t: chrome } = useStrings("assets/new")
  useSecureScreen("assets/new/account")
  const paste = useSecretPaste()
  const { submit, submitting, error } = useAssetSubmit()

  const [service, setService] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [recovery, setRecovery] = useState("")
  const [twoFactor, setTwoFactor] = useState("")
  const [disposition, setDisposition] = useState<Disposition | null>(null)
  const [shown, setShown] = useState<Record<string, boolean>>({})
  const [focused, setFocused] = useState<string | null>(null)

  const bind = (key: string) => ({
    onFocus: () => setFocused(key),
    onBlur: () => setFocused((current) => (current === key ? null : current)),
  })
  const state = (key: string) => ({
    active: focused === key,
    dimmed: focused !== null && focused !== key,
  })

  const eye = (key: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detail.fieldPassword!}
      onPress={() =>
        setShown((current) => ({ ...current, [key]: current[key] !== true }))
      }
      hitSlop={10}
      className="shrink-0"
    >
      <Icon
        as={shown[key] === true ? EyeOff : Eye}
        size={19}
        strokeWidth={2.75}
        className="text-foreground opacity-50"
      />
    </Pressable>
  )

  async function save() {
    if (disposition === null) return
    const saved = await submit({
      type: "digital",
      ...toDigitalPayload(
        { service, username, password, recovery, twoFactor, disposition },
        t
      ),
    })
    if (saved) {
      router.replace({
        pathname: "/assets/[id]/recipients",
        params: { id: saved, step: "2" },
      })
    }
  }

  const complete =
    service.trim().length > 0 &&
    username.trim().length > 0 &&
    password.length > 0 &&
    disposition !== null

  return (
    <WizardFrame
      title={t.title}
      canSubmit={complete}
      blockedLabel={disposition === null ? t.chooseToContinue! : undefined}
      submitting={submitting}
      onSubmit={() => void save()}
    >
      <View className="mb-[22px]">
        {/* Two short values on one row — a service name and a login are half a
            line each, and two full-width rows for them is paperwork. */}
        <View className="flex-row gap-[18px] py-[13px]">
          <View className="w-24 shrink-0">
            <Text className="mb-1.5 text-[12px] opacity-50">{t.serviceLabel}</Text>
            <FieldValue
              value={service}
              onChangeText={setService}
              placeholder={t.servicePlaceholder}
              {...bind("service")}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="mb-1.5 text-[12px] opacity-50">{t.usernameLabel}</Text>
            <FieldValue
              value={username}
              onChangeText={setUsername}
              placeholder={t.usernamePlaceholder}
              autoCapitalize="none"
              keyboardType="email-address"
              ltr
              className={cn(monoFont, "font-normal text-[13.5px] leading-[1.3]")}
              {...bind("username")}
            />
          </View>
        </View>
        <View className="bg-border h-px" />

        <FieldRow
          label={t.passwordLabel!}
          divider
          trailing={eye("password")}
          {...state("password")}
        >
          <SecretValue
            value={password}
            onChangeText={setPassword}
            masked={shown.password !== true}
            onSubmitEditing={() => void pasteInto(setPassword)}
            {...bind("password")}
          />
        </FieldRow>

        {/* Unmasked on purpose — see the note at the top. */}
        <FieldRow label={t.twoFactorLabel!} divider {...state("twoFactor")}>
          <FieldValue
            prose
            value={twoFactor}
            onChangeText={setTwoFactor}
            placeholder={t.twoFactorPlaceholder}
            {...bind("twoFactor")}
          />
        </FieldRow>

        <FieldRow
          label={t.recoveryLabel!}
          trailing={eye("recovery")}
          {...state("recovery")}
        >
          <SecretValue
            value={recovery}
            onChangeText={setRecovery}
            masked={shown.recovery !== true}
            mask="•••• •••• ••••"
            multiline={shown.recovery === true}
            placeholder={t.recoveryPlaceholder}
            {...bind("recovery")}
          />
        </FieldRow>
      </View>

      <Text className="mb-1 text-[12px] opacity-50">{t.dispositionLabel}</Text>
      <View className="mb-auto">
        {DISPOSITIONS.map((option, i) => (
          <RadioRow
            key={option}
            title={t[TITLE_KEY[option]]!}
            detail={t[DETAIL_KEY[option]]}
            selected={disposition === option}
            onPress={() => setDisposition(option)}
            divider={i < DISPOSITIONS.length - 1}
          />
        ))}
      </View>

      <Text className="mt-4 text-[11px] leading-[1.7] opacity-45">
        {chrome.encryptNote}
      </Text>

      {error !== null ? (
        <Text variant="meta" className="text-terracotta-800 mt-3">
          {error}
        </Text>
      ) : null}
    </WizardFrame>
  )

  async function pasteInto(set: (value: string) => void) {
    const { text } = await paste()
    if (text !== null) set(text)
  }
}

const TITLE_KEY = {
  handOver: "dispositionHandOver",
  delete: "dispositionDelete",
  memorialise: "dispositionMemorialise",
} as const satisfies Record<Disposition, string>

const DETAIL_KEY = {
  handOver: "dispositionHandOverNote",
  delete: "dispositionDeleteNote",
  memorialise: "dispositionMemorialiseNote",
} as const satisfies Record<Disposition, string>

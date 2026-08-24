/**
 * ٤.٧ — a digital account.
 *
 * The board is explicit about what this screen is for: *"The disposition radio
 * is the point of this screen — most heirs don't want the account, they want it
 * closed; make the choice explicit at capture time rather than guessing at
 * release."*
 *
 * So the choice is required, not defaulted. There is no pre-selected option,
 * and the save button stays disabled until one is picked — a default here would
 * be the app guessing on the owner's behalf about something it has just said it
 * will not guess about.
 *
 * Password and recovery codes get the same treatment as 4.3's phrase:
 * screenshots blocked, keyboard learning off, clipboard wiped after paste.
 */
import { useState } from "react"
import { Text } from "@workspace/ui-native/components/ui/text"
import { router } from "expo-router"
import { View } from "react-native"

import { Field } from "@/components/field"
import { useSecretPaste } from "@/hooks/use-secret-paste"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { SECRET_INPUT_PROPS } from "@/lib/secret-input-props"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

/** Mirrors the board's three options, in its order. */
type Disposition = "handOver" | "delete" | "memorialise"

export function NewAccountScreen() {
  const { t } = useStrings("assets/new/account")
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

  async function pasteInto(set: (value: string) => void) {
    const { text } = await paste()
    if (text !== null) set(text)
  }

  async function save() {
    if (disposition === null) return
    const saved = await submit({
      type: "digital",
      label: {
        title: `${service.trim()} · ${username.trim()}`,
        subtitle: `${t.title} · ${DISPOSITION_LABEL(t)[disposition]}`,
      },
      // One blob holding everything an heir needs, as JSON. The disposition
      // travels *inside* the ciphertext: it is an instruction about the
      // owner's account, and the server has no business reading it.
      secret: JSON.stringify({
        service: service.trim(),
        username: username.trim(),
        password,
        recoveryCodes: recovery
          .split(/\s*\n\s*/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0),
        twoFactor: twoFactor.trim(),
        disposition,
      }),
      meta: {},
    })
    if (saved) router.back()
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={
        service.trim().length > 0 &&
        username.trim().length > 0 &&
        password.length > 0 &&
        disposition !== null
      }
      submitting={submitting}
      onSubmit={() => void save()}
    >
      <View className="gap-4">
        <Field
          label={t.serviceLabel}
          placeholder={t.servicePlaceholder}
          value={service}
          onChangeText={setService}
        />
        <Field
          label={t.usernameLabel}
          placeholder={t.usernamePlaceholder}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field
          {...SECRET_INPUT_PROPS}
          label={t.passwordLabel}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onSubmitEditing={() => void pasteInto(setPassword)}
        />
        <Field
          {...SECRET_INPUT_PROPS}
          label={t.recoveryLabel}
          placeholder={t.recoveryPlaceholder}
          value={recovery}
          onChangeText={setRecovery}
          multiline
          className="h-auto min-h-20 py-3"
        />

        {/* Where the second factor lives, not a code. A rotating six digits is
            worthless to an heir; "Authy on the iPad" is what gets them in —
            and an account whose 2FA nobody can reach is lost as surely as one
            whose password nobody has. */}
        <Field
          {...SECRET_INPUT_PROPS}
          label={t.twoFactorLabel}
          placeholder={t.twoFactorPlaceholder}
          value={twoFactor}
          onChangeText={setTwoFactor}
          multiline
          className="h-auto min-h-20 py-3"
        />

        <View className="gap-2">
          <OptionChips
            label={t.dispositionLabel}
            options={[
              { value: "handOver", label: t.dispositionHandOver },
              { value: "delete", label: t.dispositionDelete },
              { value: "memorialise", label: t.dispositionMemorialise },
            ]}
            // No default: the board asks for this to be a decision, and an
            // empty string matches none of the chips, so none renders active.
            value={disposition ?? ""}
            onChange={(value) => setDisposition(value as Disposition)}
          />
          <Text variant="metaSm" className="text-muted-foreground">
            {t.dispositionNote}
          </Text>
        </View>

        <Text variant="metaSm" className="text-muted-foreground leading-[1.7]">
          {chrome.encryptNote}
        </Text>

        {error !== null ? (
          <Text variant="meta" className="text-terracotta-800">
            {error}
          </Text>
        ) : null}
      </View>
    </WizardFrame>
  )
}

const DISPOSITION_LABEL = (t: Record<string, string>) =>
  ({
    handOver: t.dispositionHandOver!,
    delete: t.dispositionDelete!,
    memorialise: t.dispositionMemorialise!,
  }) satisfies Record<Disposition, string>

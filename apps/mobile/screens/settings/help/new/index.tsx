/**
 * ٩.٦b — a new conversation.
 *
 * `topic` arrives prefilled from the places that used to say "contact us" and
 * lead nowhere: the exhausted identity check, the paywall, the plan screen.
 */
import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { looksLikeRecoveryCode } from "@workspace/crypto/papercode"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChipRow } from "@workspace/ui-native/components/wassiya/chip-row"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { router, useLocalSearchParams } from "expo-router"
import { View } from "react-native"

import { Field } from "@/components/field"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"
import {
  OWNER_TOPICS,
  TOPIC_KEY,
  isOwnerTopic,
  supportErrorKey,
  type OwnerTopic,
} from "@/lib/support"

export function NewSupportThreadScreen() {
  const { t, locale } = useStrings("settings/help/new")
  const { t: support } = useStrings("support")
  const params = useLocalSearchParams<{ topic?: string }>()
  const start = useMutation(api.support.threads.start)
  const [topic, setTopic] = useState<OwnerTopic>(
    isOwnerTopic(params.topic) ? params.topic : "other"
  )
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sheetInText = looksLikeRecoveryCode(body)
  const canSend = !busy && !sheetInText && body.trim().length > 0

  async function submit() {
    if (!canSend) return
    setBusy(true)
    setError(null)
    try {
      const threadId = await start({
        surface: "mobile",
        topic,
        locale,
        body,
        attachments: [],
      })
      router.replace(`/settings/help/${threadId}`)
    } catch (cause) {
      setError(support[supportErrorKey(cause)]!)
      setBusy(false)
    }
  }

  return (
    <Screen
      keyboard
      inset="footer"
      footer={
        <PrimaryCta label={t.send} onPress={submit} disabled={!canSend} busy={busy} />
      }
    >
      <ScreenHeader back title={t.title!} />

      <ChipRow
        className="mb-header"
        label={t.topic}
        options={OWNER_TOPICS.map((key) => ({
          value: key,
          label: support[TOPIC_KEY[key]]!,
        }))}
        value={topic}
        onChange={(value) => setTopic(value as OwnerTopic)}
      />

      <View className="gap-3">
        <Field
          label={t.message!}
          value={body}
          onChangeText={setBody}
          placeholder={t.placeholder}
          multiline
          error={sheetInText ? support.recoveryWarning : (error ?? undefined)}
        />
        <Text variant="footnote">
          {t.attachLater} {support.guardrail}
        </Text>
      </View>
    </Screen>
  )
}

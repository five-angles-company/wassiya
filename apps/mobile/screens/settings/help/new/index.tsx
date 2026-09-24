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
import { TextInput, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
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
  const { t: common } = useStrings("common")
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
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mb-header mt-4">
        {t.title}
      </Text>

      <View className="mb-header gap-3">
        <Text variant="sectionLabel">{t.topic}</Text>
        <ChipRow
          options={OWNER_TOPICS.map((key) => ({
            value: key,
            label: support[TOPIC_KEY[key]]!,
          }))}
          value={topic}
          onChange={(value) => setTopic(value as OwnerTopic)}
        />
      </View>

      <View className="gap-3">
        <Text variant="sectionLabel">{t.message}</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t.placeholder}
          multiline
          textAlignVertical="top"
          className="bg-card text-foreground placeholder:text-muted-foreground/60 min-h-40 rounded-[18px] px-4 py-3.5 text-[15px] leading-[1.6]"
        />
        {sheetInText ? (
          <Text className="text-terracotta-700 font-body-semibold text-[13px] leading-[1.6]">
            {support.recoveryWarning}
          </Text>
        ) : null}
        {error !== null ? (
          <Text className="text-terracotta-700 text-[13px]">{error}</Text>
        ) : null}
        <Text variant="footnote">
          {t.attachLater} {support.guardrail}
        </Text>
      </View>
    </Screen>
  )
}

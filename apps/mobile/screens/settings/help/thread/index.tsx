/**
 * ٩.٦c — one support conversation, live.
 *
 * Staff replies are signed by the team, never by a person: the backend does
 * not say who answered. Attachments leave the device unencrypted, which the
 * composer's standing note says.
 */
import { useEffect, useState } from "react"
import { useMutation, usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { looksLikeRecoveryCode } from "@workspace/crypto/papercode"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChatBubble } from "@workspace/ui-native/components/wassiya/chat-bubble"
import { ChatComposer } from "@workspace/ui-native/components/wassiya/chat-composer"
import { fmtDate, fmtTime } from "@workspace/ui-native/lib/format"
import * as DocumentPicker from "expo-document-picker"
import { useLocalSearchParams } from "expo-router"
import { Linking, Pressable, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import {
  TOPIC_KEY,
  supportErrorKey,
  uploadSupportFile,
  type SupportFile,
} from "@/lib/support"

const MAX_FILES = 5
const MAX_BYTES = 10 * 1024 * 1024

export function SupportThreadScreen() {
  const { t, locale } = useStrings("settings/help/thread")
  const { t: common } = useStrings("common")
  const { t: support } = useStrings("support")
  const { threadId: raw } = useLocalSearchParams<{ threadId: string }>()
  const threadId = raw as Id<"supportThreads">

  const thread = useQuery(api.support.threads.thread, { threadId })
  const messages = usePaginatedQuery(
    api.support.threads.messages,
    { threadId },
    { initialNumItems: 50 }
  )
  const send = useMutation(api.support.threads.send)
  const uploadUrl = useMutation(api.support.threads.generateUploadUrl)
  const markRead = useMutation(api.support.threads.markRead)

  const [body, setBody] = useState("")
  const [files, setFiles] = useState<SupportFile[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unread = thread?.unread === true
  useEffect(() => {
    if (unread) void markRead({ threadId })
  }, [unread, threadId, markRead])

  const sheetInText = looksLikeRecoveryCode(body)
  const canSend =
    !sheetInText && (body.trim().length > 0 || files.length > 0)

  async function attach() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
      multiple: true,
    })
    if (result.canceled) return
    const picked = result.assets
      .filter((asset) => (asset.size ?? 0) <= MAX_BYTES)
      .map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
      }))
    if (picked.length < result.assets.length) setError(support.refusedAttachment!)
    setFiles((current) => [...current, ...picked].slice(0, MAX_FILES))
  }

  async function submit() {
    if (!canSend || busy) return
    setBusy(true)
    setError(null)
    try {
      const attachments = []
      for (const file of files) {
        const storageId = await uploadSupportFile(
          file,
          await uploadUrl({ threadId })
        )
        attachments.push({ storageId: storageId as Id<"_storage">, name: file.name })
      }
      await send({ threadId, body, attachments })
      setBody("")
      setFiles([])
    } catch (cause) {
      setError(support[supportErrorKey(cause)]!)
    } finally {
      setBusy(false)
    }
  }

  const ordered = [...messages.results].reverse()

  return (
    <Screen
      keyboard
      inset="footer"
      footer={
        thread ? (
          <ChatComposer
            value={body}
            onChangeText={setBody}
            onSend={submit}
            placeholder={t.placeholder}
            note={support.guardrail}
            sendLabel={t.send}
            attachLabel={t.attach}
            onAttach={files.length < MAX_FILES ? attach : undefined}
            files={files}
            onRemoveFile={(index) =>
              setFiles((current) => current.filter((_, i) => i !== index))
            }
            warning={sheetInText ? support.recoveryWarning : null}
            error={error}
            disabled={!canSend}
            busy={busy}
          />
        ) : undefined
      }
    >
      <BackButton label={common.back} fallbackHref="/settings/help" />

      {thread === null ? (
        <Text variant="prose" className="mt-header">
          {t.notFound}
        </Text>
      ) : (
        <>
          <Text variant="screenTitle" className="mb-header mt-4">
            {thread ? support[TOPIC_KEY[thread.topic]] : ""}
          </Text>

          {messages.status === "CanLoadMore" ? (
            <Pressable onPress={() => messages.loadMore(50)} className="mb-4 py-2">
              <Text variant="action">{t.loadOlder}</Text>
            </Pressable>
          ) : null}
          {thread?.filesPurged ? (
            <Text variant="footnote" className="mb-4">
              {t.filesPurged}
            </Text>
          ) : null}

          <View className="gap-4">
            {ordered.map((message) => {
              const own = message.author === "requester"
              const when = `${fmtDate(new Date(message.at), locale)} · ${fmtTime(new Date(message.at), locale)}`
              return (
                <ChatBubble
                  key={message.id}
                  own={own}
                  body={message.body}
                  meta={`${own ? t.you : t.us} · ${when}`}
                  attachments={message.attachments.map((file) => ({
                    name: file.name,
                    onPress:
                      file.url === null
                        ? undefined
                        : () => void Linking.openURL(file.url!),
                  }))}
                />
              )
            })}
          </View>

          {thread?.status === "resolved" ? (
            <Text variant="footnote" className="mt-6">
              {t.closed}
            </Text>
          ) : null}
        </>
      )}
    </Screen>
  )
}

/**
 * ٩.٦ — المساعدة والدعم.
 *
 * Questions first, because most answers are already written; then the
 * owner's conversations, and a way to start one. The articles are edited in
 * the console and never state a limit or a price.
 */
import { useState } from "react"
import { usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { ChevronDown, MessageCirclePlus } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { TOPIC_KEY } from "@/lib/support"

export function HelpScreen() {
  const { t, locale } = useStrings("settings/help")
  const { t: common } = useStrings("common")
  const { t: support } = useStrings("support")
  const articles = useQuery(api.support.help.articles, {
    audiences: ["owner"],
    locale,
  })
  const threads = usePaginatedQuery(
    api.support.threads.list,
    {},
    { initialNumItems: 10 }
  )

  return (
    <Screen>
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mb-header mt-4">
        {t.title}
      </Text>

      <View className="mb-header rounded-card bg-card overflow-hidden">
        <SettingsRow
          icon={MessageCirclePlus}
          label={t.newConversation}
          detail={t.newConversationDetail}
          chevron
          onPress={() => router.push("/settings/help/new")}
        />
      </View>

      {threads.results.length > 0 ? (
        <View className="mb-header gap-2">
          <Text variant="sectionLabel">{t.conversations}</Text>
          <View className="rounded-card bg-card overflow-hidden">
            {threads.results.map((thread, index) => (
              <SettingsRow
                key={thread.id}
                label={support[TOPIC_KEY[thread.topic]]!}
                detail={thread.preview}
                value={
                  thread.unread
                    ? t.newReply
                    : `${statusLabel(thread.status, t)} · ${fmtDate(new Date(thread.lastMessageAt), locale)}`
                }
                valueTone={thread.unread ? "action" : "default"}
                chevron
                divider={index < threads.results.length - 1}
                onPress={() => router.push(`/settings/help/${thread.id}`)}
              />
            ))}
          </View>
          {threads.status === "CanLoadMore" ? (
            <Pressable onPress={() => threads.loadMore(10)} className="py-2">
              <Text variant="action">{t.loadMore}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {articles !== undefined && articles.length > 0 ? (
        <View className="gap-2">
          <Text variant="sectionLabel">{t.questions}</Text>
          <View className="rounded-card bg-card overflow-hidden">
            {articles.map((article, index) => (
              <Article
                key={article.slug}
                title={article.title}
                body={article.body}
                divider={index < articles.length - 1}
              />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  )
}

function Article({
  title,
  body,
  divider,
}: {
  title: string
  body: string
  divider: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={() => setOpen(!open)}
      className={
        divider ? "border-border gap-2 border-b px-4 py-3.5" : "gap-2 px-4 py-3.5"
      }
    >
      <View className="flex-row items-center gap-3">
        <Text variant="rowTitle" className="flex-1">
          {title}
        </Text>
        <Icon
          as={ChevronDown}
          className={
            open
              ? "size-4 rotate-180 opacity-50"
              : "size-4 opacity-50"
          }
        />
      </View>
      {open ? <Text variant="prose">{body}</Text> : null}
    </Pressable>
  )
}

function statusLabel(
  status: "open" | "waiting" | "resolved",
  t: Record<string, string>
): string {
  if (status === "open") return t.statusOpen!
  if (status === "waiting") return t.statusWaiting!
  return t.statusResolved!
}

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

import { LoadMore } from "@/components/load-more"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"
import { TOPIC_KEY } from "@/lib/support"

export function HelpScreen() {
  const { t, locale } = useStrings("settings/help")
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
      <ScreenHeader back title={t.title!} />

      <View className="mb-6 rounded-card bg-card overflow-hidden">
        <SettingsRow
          icon={MessageCirclePlus}
          label={t.newConversation}
          detail={t.newConversationDetail}
          chevron
          onPress={() => router.push("/settings/help/new")}
        />
      </View>

      {threads.results.length > 0 ? (
        <View className="mb-6 gap-2">
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
            <LoadMore label={t.loadMore!} onPress={() => threads.loadMore(10)} />
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
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        className="gap-2 px-4 py-3.5 active:opacity-70"
      >
        <View className="flex-row items-center gap-3">
          <Text variant="rowTitle" className="flex-1">
            {title}
          </Text>
          <Icon
            as={ChevronDown}
            className={
              open
                ? "text-muted-foreground size-4 rotate-180"
                : "text-muted-foreground size-4"
            }
          />
        </View>
        {open ? <Text variant="proseSm">{body}</Text> : null}
      </Pressable>
      {divider ? <View className="bg-border mx-4 h-px" /> : null}
    </View>
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

/**
 * ٥.١ — الورثة. The people, and only the people: no coverage strip, no routing
 * CTA, no guardian row — "not asset division just heirs management". Routing
 * stays one tap away on Home's التوجيه tile and the vault's unrouted banner; the
 * guardian is on Home's الوصي tile.
 *
 * The per-heir "لا تستلم شيئاً بعد" line stayed, because it is not division — it
 * is the one fact about an heir that can be silently wrong, and the exact mirror
 * of "بلا مستلم" on an asset.
 *
 * The whole card opens ٥.٤; editing lives there rather than behind a per-row
 * pencil, which would put a second target on every card for the rarer errand.
 */
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { HeirsEmpty } from "@/screens/heirs/components/heirs-empty"
import { HeirCard } from "@workspace/ui-native/components/wassiya/heir-card"
import { fmtNum, fmtPhoneMasked } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { Plus } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { Screen } from "@/components/screen"
import { fmtCount, type CountForms } from "@/i18n/plural"
import { useStrings } from "@/i18n/use-strings"
import { relationLabel } from "@/screens/heirs/relations"

export function HeirsScreen() {
  const { t, locale } = useStrings("heirs")
  // Only for the eight relation labels. `heirs.list` returns the stored
  // English key — see `relations.ts` — so the card has to translate it.
  const { t: fields } = useStrings("heirs/new")
  const heirs = useQuery(api.heirs.list)

  const heirForms: CountForms = {
    zero: t.countZero,
    one: t.countOne,
    two: t.countTwo,
    few: t.countFew,
    many: t.countMany,
  }

  if (heirs !== undefined && heirs.length === 0) {
    // `gap-header`, matching ٤.١b exactly. `HeirsEmpty` returns a fragment, so
    // its blocks are direct children of this container and the gap between
    // title, lede, ghosts and CTA comes from here — without it the two empty
    // screens space differently for no reason a reader could name.
    return (
      <Screen contentClassName="gap-header">
        {/* The empty list keeps a full-width button rather than the FAB: it is
            the only action on an otherwise blank screen, and a round button in
            the corner of one reads as an afterthought. Same call as ٤.١'s. */}
        <HeirsEmpty
          title={t.title}
          subtitle={t.emptySubtitle!}
          lead={t.emptyLead!}
          addLabel={t.add!}
          onAdd={() => router.push("/heirs/new")}
        />
      </Screen>
    )
  }

  const count = heirs?.length ?? 0

  return (
    <Screen
      contentClassName="gap-header"
      float={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.add}
          onPress={() => router.push("/heirs/new")}
          className="bg-primary active:bg-terracotta-600 size-14 items-center justify-center rounded-full shadow-md"
        >
          <Icon as={Plus} size={26} strokeWidth={2.75} className="text-background" />
        </Pressable>
      }
    >
      {/* ٤.١'s header block: a quiet count over a 19px name. */}
      <View className="min-w-0">
        {heirs !== undefined ? (
          <Text variant="metaSm">
            {fmtCount(count, fmtNum(count, locale), heirForms, locale)}
          </Text>
        ) : null}
        <Text variant="pageTitle">{t.title}</Text>
      </View>

      <View className="gap-row mb-auto">
        {(heirs ?? []).map((heir) => (
          <HeirCard
            key={heir.id}
            name={heir.name}
            relation={`${relationLabel(heir.relation, fields)} · ${fmtPhoneMasked(heir.phone)}`}
            locale={locale}
            labels={{ receivesNothing: t.receivesNothing }}
            receivesSummary={
              heir.routedAssetCount === 0
                ? undefined
                : `${t.receives.replace("{n}", fmtNum(heir.routedAssetCount, locale))}${
                    heir.messageKind === null ? "" : ` · ${t.withMessage}`
                  }`
            }
            onPress={() =>
              router.push({
                pathname: "/heirs/[id]/preview",
                params: { id: heir.id },
              })
            }
          />
        ))}
      </View>
    </Screen>
  )
}

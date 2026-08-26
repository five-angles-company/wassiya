/**
 * ٥.١ — الورثة. The people, and only the people.
 *
 * ## What left, and why it is not missing
 *
 * This screen used to carry a coverage strip ("٣٥ من ٤٣ أصلاً لها مستلم"), an
 * unrouted warning naming an asset, a "من يستلم ماذا؟" CTA, and the guardian
 * row. All four went at the owner's direction: *"not asset division just heirs
 * management"*.
 *
 * Nothing was orphaned by that. Routing is still one tap from Home's التوجيه
 * tile and from the vault's own unrouted banner — the two places that were
 * already answering it. The guardian is on Home's الوصي tile. What this screen
 * gained is a single subject: a list of people you can add, correct and remove.
 *
 * The one thing that stayed is the per-heir **"لا تستلم شيئاً بعد"** line, and
 * it stayed because it is not division — it is the single fact about an *heir*
 * that can be silently wrong, and it is the exact mirror of "بلا مستلم" on an
 * asset. Terracotta there means what terracotta means everywhere in this app:
 * needs you.
 *
 * ## One card, one target
 *
 * The whole card opens ٥.٤ — what this person actually receives. Editing lives
 * a level down, on that screen, and deliberately not here: a pencil per row
 * puts a second target on every card for the rarer errand, and the owner asked
 * for it on the detail screen instead.
 *
 * ## Home's language
 *
 * `Screen` with `gap-header`, a `metaSm` count over a `pageTitle`, `gap-row`
 * between cards, and the add button in the `float` slot — the same shell and
 * the same rhythm as ٤.١. `HeirCard` already sat on `rounded-card bg-card`, so
 * consistency here cost a padding change, not a new component.
 */
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { HeirCard } from "@workspace/ui-native/components/wassiya/heir-card"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { fmtNum, fmtPhoneMasked } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { Plus, Users } from "lucide-react-native"
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
    return (
      <Screen contentClassName="gap-header">
        <Text variant="pageTitle">{t.title}</Text>
        {/* The empty list keeps a full-width button rather than the FAB: it is
            the only action on an otherwise blank screen, and a round button in
            the corner of one reads as an afterthought. Same call as ٤.١'s. */}
        <EmptyState
          icon={Users}
          title={t.emptyTitle}
          subtitle={t.emptyBody}
          action={
            <PrimaryCta
              label={t.add!}
              icon={Plus}
              onPress={() => router.push("/heirs/new")}
            />
          }
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

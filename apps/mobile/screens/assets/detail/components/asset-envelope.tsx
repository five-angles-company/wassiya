import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { InitialDisc } from "@workspace/ui-native/components/wassiya/initial-disc"
import type { Tone } from "@workspace/ui-native/lib/tone"
import { cn } from "@workspace/ui-native/lib/utils"
import { Users } from "lucide-react-native"
import { View } from "react-native"

/**
 * The asset as one addressed object.
 *
 * ## Why an envelope and not a page of sections
 *
 * Four rewrites of this screen were the same shape: a scroll of headed sections
 * — identity, then recipients, then content, then maintenance — with the order
 * and the colours shuffled. That shape describes a *record*, and it is why the
 * screen kept coming out looking like a form no matter how it was styled.
 *
 * An asset in this product is not a record. It is a thing being left to a named
 * person, and the object that already means exactly that is an addressed
 * envelope: what it is, and who it is for, on one surface — with the contents
 * sealed until someone with the right to open it does.
 *
 * So the recipient is not a section below the asset. It is **on** the asset,
 * under a rule, where an address belongs. Nothing here can be read without
 * reading who it is for.
 *
 * ## No type glyph
 *
 * The list row that got you here already showed it, and a decorative mark at
 * the top of a detail screen is a header pretending to be a hero. The type is a
 * kicker instead — a word, where a word is what it is.
 */
export type AssetEnvelopeProps = {
  assetId: Id<"assets">
  /** Category name: "حساب رقمي", "مستند". */
  kicker: string
  title: string
  subtitle?: string
  tone?: Tone
  /** "إلى" — the address line. */
  toLabel: string
  allHeirsLabel: string
  executorLabel: string
  /** Shown in place of an address when the asset still reaches nobody. */
  unaddressedLabel: string
  className?: string
}

const SKIN: Record<Tone, { fill: string; rule: string; kicker: string }> = {
  terracotta: {
    fill: "bg-terracotta-100",
    rule: "border-terracotta-200",
    kicker: "text-terracotta-700",
  },
  olive: {
    fill: "bg-olive-100",
    rule: "border-olive-200",
    kicker: "text-olive-700",
  },
  sand: { fill: "bg-sand-100", rule: "border-sand-300", kicker: "text-sand-600" },
}

export function AssetEnvelope({
  assetId,
  kicker,
  title,
  subtitle,
  tone = "sand",
  toLabel,
  allHeirsLabel,
  executorLabel,
  unaddressedLabel,
  className,
}: AssetEnvelopeProps) {
  const rows = useQuery(api.routing.forAsset, { assetId })
  const heirs = useQuery(api.heirs.list)
  const skin = SKIN[tone]

  const names = (rows ?? []).map((row) => {
    // Bound to a `const` first: narrowing on `row.recipient` does not survive
    // into the `find` callback, which reads it from a fresh closure.
    const to = row.recipient
    if (to.kind === "allHeirs") return allHeirsLabel
    if (to.kind === "executor") return executorLabel
    return heirs?.find((heir) => heir.id === to.heirId)?.name ?? ""
  })

  return (
    <View
      className={cn(
        "rounded-summary gap-5 p-5 shadow-md",
        skin.fill,
        className
      )}
    >
      <View className="gap-1">
        <Text variant="kicker" className={skin.kicker}>
          {kicker}
        </Text>
        <Text variant="screenTitle" numberOfLines={3}>
          {title}
        </Text>
        {subtitle !== undefined && subtitle.length > 0 ? (
          <Text variant="metaSm" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* The address, under a rule. An envelope with no name on it is the one
          failure this product exists to prevent, so the empty case is stated
          plainly here rather than hidden behind a banner somewhere below. */}
      <View className={cn("gap-2.5 border-t pt-4", skin.rule)}>
        <Text variant="kicker" className={skin.kicker}>
          {toLabel}
        </Text>

        {rows === undefined ? null : names.length === 0 ? (
          <Text variant="rowTitle" className="text-terracotta-700">
            {unaddressedLabel}
          </Text>
        ) : (
          names.map((name, i) => (
            <View key={`${name}-${i}`} className="flex-row items-center gap-3">
              {/* The shared bucket is a group, not a person. A letter disc
                  would make a category look like someone. */}
              {name === allHeirsLabel ? (
                <View className="bg-olive-200 size-9 items-center justify-center rounded-full">
                  <Icon
                    as={Users}
                    size={17}
                    strokeWidth={2.75}
                    className="text-olive-700"
                  />
                </View>
              ) : (
                <InitialDisc name={name} />
              )}
              <Text
                variant="rowTitle"
                numberOfLines={1}
                className="min-w-0 flex-1"
              >
                {name}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  )
}

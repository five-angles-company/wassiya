import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { BellRing, EyeOff } from "lucide-react-native"
import { Pressable, View } from "react-native"

export type HeirMode = "silent" | "notified"

export type ModeChoiceProps = {
  value: HeirMode
  onChange: (value: HeirMode) => void
  labels: Record<string, string>
}

/**
 * ٥.٢'s "هل تخبره الآن؟" — silent or notified.
 *
 * Two cards rather than chips, because each option needs its consequence
 * spelled out underneath. This is the one field on the screen whose effect
 * happens *outside* the app: picking "مُبلَّغ" sends someone a message telling
 * them they are in a will, which cannot be taken back and lands in a family
 * where it may be the first they hear of it.
 *
 * Silent leads and is the default, which is the board's instruction and the
 * product's position: an heir learning nothing until release is the normal
 * case, not the cautious one. A notified heir still sees **no content** — the
 * mode changes who knows they are named, never what anyone can read.
 */
export function ModeChoice({ value, onChange, labels }: ModeChoiceProps) {
  return (
    <View className="gap-2">
      <Text variant="meta" className="text-muted-foreground">
        {labels.modeLabel}
      </Text>
      <ModeCard
        icon={EyeOff}
        title={labels.modeSilent!}
        note={labels.modeSilentNote!}
        selected={value === "silent"}
        onPress={() => onChange("silent")}
      />
      <ModeCard
        icon={BellRing}
        title={labels.modeNotified!}
        note={labels.modeNotifiedNote!}
        selected={value === "notified"}
        onPress={() => onChange("notified")}
      />
    </View>
  )
}

function ModeCard({
  icon,
  title,
  note,
  selected,
  onPress,
}: {
  icon: typeof EyeOff
  title: string
  note: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      className={cn(
        "rounded-row flex-row items-start gap-3 border p-4",
        selected
          ? "border-terracotta-700 bg-terracotta-100"
          : "border-border active:bg-sand-200 bg-card"
      )}
    >
      <Icon
        as={icon}
        className={cn(
          "mt-0.5 size-4.5 shrink-0",
          selected ? "text-terracotta-700" : "text-muted-foreground"
        )}
      />
      <View className="min-w-0 flex-1 gap-1">
        <Text variant="rowTitle">{title}</Text>
        <Text variant="metaSm" className="text-muted-foreground leading-[1.6]">
          {note}
        </Text>
      </View>
    </Pressable>
  )
}

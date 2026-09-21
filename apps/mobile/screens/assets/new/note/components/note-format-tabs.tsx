import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Mic, PenLine } from "lucide-react-native"
import { Pressable, View } from "react-native"

import type { NoteFormat } from "@/stores/note-draft"

/**
 * Written or spoken, for one note.
 *
 * Not chips. The kind pills above already say what the note is *about*, and a
 * second row of terracotta pills underneath would read as one set of six
 * choices. This is the same "active field" grammar the vault already uses —
 * terracotta label over a 2px rule — sitting on the hairline that separates
 * the title from the body, so the switch reads as the head of the composer
 * rather than as more metadata.
 */
export type NoteFormatTabsProps = {
  value: NoteFormat
  onChange: (format: NoteFormat) => void
  textLabel: string
  voiceLabel: string
  /** Locked once there is something to lose by switching. */
  disabled?: boolean
  className?: string
}

export function NoteFormatTabs({
  value,
  onChange,
  textLabel,
  voiceLabel,
  disabled = false,
  className,
}: NoteFormatTabsProps) {
  return (
    <View className={className}>
      <View accessibilityRole="tablist" className="flex-row gap-5">
        <Tab
          icon={PenLine}
          label={textLabel}
          active={value === "text"}
          disabled={disabled}
          onPress={() => onChange("text")}
        />
        <Tab
          icon={Mic}
          label={voiceLabel}
          active={value === "voice"}
          disabled={disabled}
          onPress={() => onChange("voice")}
        />
      </View>
      <View className="bg-border h-px" />
    </View>
  )
}

function Tab({
  icon,
  label,
  active,
  disabled,
  onPress,
}: {
  icon: typeof Mic
  label: string
  active: boolean
  disabled: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active, disabled }}
      onPress={onPress}
      disabled={disabled}
      className={cn("gap-2.5 pb-2.5", disabled && !active && "opacity-40")}
    >
      <View className="flex-row items-center gap-1.5">
        <Icon
          as={icon}
          size={15}
          className={active ? "text-primary" : "text-muted-foreground"}
        />
        <Text
          className={cn(
            "text-[13.5px]",
            active
              ? "font-body-semibold text-primary"
              : "text-muted-foreground"
          )}
        >
          {label}
        </Text>
      </View>
      <View
        className={cn(
          "h-0.5 rounded-full",
          active ? "bg-primary" : "bg-transparent"
        )}
      />
    </Pressable>
  )
}

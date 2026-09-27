import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Plus, type LucideIcon } from "lucide-react-native"
import { View } from "react-native"

/**
 * A list tab with nothing in it yet, under the screen's own header: one icon,
 * one question, one sentence and the button that answers it, centred in the
 * free space. Olive, never terracotta — an empty tab is a normal first day.
 *
 * ⚠️ Returns a fragment: mount it directly in a `Screen`, whose content grows,
 * so the block can centre and the footnote can sit at the foot.
 */
export function EmptyTab({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  footnote,
  footnoteIcon,
}: {
  icon: LucideIcon
  title: string
  body: string
  actionLabel: string
  onAction: () => void
  footnote?: string
  footnoteIcon?: LucideIcon
}) {
  return (
    <>
      <View className="flex-1 items-center justify-center py-8">
        <View className="size-16 items-center justify-center rounded-full bg-olive-100">
          <Icon
            as={icon}
            size={28}
            strokeWidth={2.75}
            className="text-olive-800"
          />
        </View>
        <Text variant="dialogTitle" className="mt-5 text-center">
          {title}
        </Text>
        <Text variant="proseSm" className="mt-2 max-w-80 text-center">
          {body}
        </Text>
        <PrimaryCta
          icon={Plus}
          label={actionLabel}
          onPress={onAction}
          className="mt-7 self-stretch"
        />
      </View>
      {footnote !== undefined ? (
        <View className="flex-row items-center justify-center gap-2">
          {footnoteIcon !== undefined ? (
            <Icon
              as={footnoteIcon}
              size={14}
              strokeWidth={2.75}
              className="text-muted-foreground"
            />
          ) : null}
          <Text variant="metaSm" className="shrink text-center">
            {footnote}
          </Text>
        </View>
      ) : null}
    </>
  )
}

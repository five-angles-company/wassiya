import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { Sprout } from "lucide-react-native"
import { Pressable } from "react-native"

export type AssetsEmptyProps = {
  title: string
  body: string
  actionLabel: string
  browseLabel: string
  onAdd: () => void
}

/**
 * ٤.١b — the vault with nothing in it yet.
 *
 * Both affordances open the same 4.2 picker, which is why the second is a
 * quiet text link and not a second button: the board allows exactly one primary
 * CTA, and "أضف أول أصل" and "أو استعرض الأنواع المتاحة" are two sentences
 * about one destination, not two choices.
 */
export function AssetsEmpty({
  title,
  body,
  actionLabel,
  browseLabel,
  onAdd,
}: AssetsEmptyProps) {
  return (
    <EmptyState
      icon={Sprout}
      title={title}
      subtitle={body}
      action={
        <Button onPress={onAdd} className="px-8">
          <Text>{actionLabel}</Text>
        </Button>
      }
      secondaryAction={
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          className="px-2 py-1"
        >
          <Text variant="metaSm" className="text-muted-foreground underline">
            {browseLabel}
          </Text>
        </Pressable>
      }
    />
  )
}

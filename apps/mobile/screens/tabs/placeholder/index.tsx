import { Text } from "@workspace/ui-native/components/ui/text"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { Sprout } from "lucide-react-native"

import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

export type TabPlaceholderProps = {
  title: string
}

/**
 * The stubbed body behind each tab until sections ٣–٥ are built.
 *
 * Uses the product's own empty-state voice rather than a developer placeholder:
 * a user who finishes onboarding lands here, and "coming next" in the app's
 * tone reads as a roadmap, where a bare TODO reads as a broken build.
 */
export function TabPlaceholder({ title }: TabPlaceholderProps) {
  const { t } = useStrings("tabs")

  return (
    <Screen scroll={false}>
      <Text variant="screenTitle" className="mb-header">
        {title}
      </Text>
      <EmptyState
        icon={Sprout}
        title={t.placeholderTitle}
        subtitle={t.placeholderBody}
      />
    </Screen>
  )
}

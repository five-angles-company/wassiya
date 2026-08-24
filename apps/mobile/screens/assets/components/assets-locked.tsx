import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { Lock } from "lucide-react-native"

export type AssetsLockedProps = {
  title: string
  body: string
  actionLabel: string
  onUnlock: () => void
  /** True while the OS prompt is up — the button must not stack a second one. */
  busy: boolean
}

/**
 * What the assets tab shows before the vault is open.
 *
 * The board's 4.1 has no lock screen, and this is not one: it is the empty
 * state's own template under the screen's own title, so الأصول still looks like
 * الأصول. The search field and category chips are withheld until there is
 * something to search — every label on this screen is ciphertext until the key
 * is in memory, so a filter over a locked vault would be a control that cannot
 * do anything.
 *
 * What it is *not* is an automatic biometric prompt on tab focus — tapping
 * الأصول to check a count should not summon Face ID.
 *
 * `EmptyState` keeps its olive blob here rather than a warning tint. A locked
 * vault is the correct resting state of a vault, not a problem with one.
 */
export function AssetsLocked({
  title,
  body,
  actionLabel,
  onUnlock,
  busy,
}: AssetsLockedProps) {
  return (
    <EmptyState
      icon={Lock}
      title={title}
      subtitle={body}
      action={
        <Button onPress={onUnlock} disabled={busy} className="px-8">
          <Text>{actionLabel}</Text>
        </Button>
      }
    />
  )
}

import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export type FieldLinkProps = {
  /** Sits above the box, 12.5px at muted — the same line `field` draws. */
  label: string;
  /** The current value. `placeholder` shows instead when this is empty. */
  value: string;
  placeholder?: string;
  /** One quiet line under the box. */
  hint?: string;
  /**
   * `down` opens something in place — a sheet. `forward` leaves for another
   * screen, and is mirrored under RTL.
   */
  chevron?: 'down' | 'forward';
  onPress: () => void;
  className?: string;
};

/**
 * A field-shaped control that does not take typing.
 *
 * ## Why this is its own component
 *
 * `sheet-select` drew this box inline, so it was the only thing in the product
 * that looked like a field but opened something. The moment a *second* one was
 * needed — ٩.١b's email row, which pushes to ٩.١c rather than editing in place
 * — the choice was to copy those classes or to name them. Copied, the two would
 * have drifted the first time the box height or border changed.
 *
 * `sheet-select` renders this now, so the boxed-field look has one owner.
 *
 * ## The chevron says where you are going
 *
 * Down for a sheet, forward for a screen. It is a small distinction and it is
 * the only thing distinguishing the two, so it is a prop rather than a default:
 * a forward chevron on something that opens a sheet is a promise the sheet then
 * breaks.
 */
export function FieldLink({
  label,
  value,
  placeholder = '—',
  hint,
  chevron = 'forward',
  onPress,
  className,
}: FieldLinkProps) {
  return (
    <View className={cn('gap-2', className)}>
      <Text variant="meta" className="text-muted-foreground">
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value }}
        onPress={onPress}
        className="rounded-box border-border bg-card h-12.5 flex-row items-center justify-between border px-4 active:bg-sand-300">
        <Text className="text-body shrink" numberOfLines={1}>
          {value.length === 0 ? placeholder : value}
        </Text>
        {/* Chevron-down is vertical, so it needs no RTL mirroring; the forward
            one does, and `flip` is what gives it. */}
        {chevron === 'down' ? (
          <Icon as={ChevronDown} className="text-muted-foreground size-4" />
        ) : (
          <Icon as={ChevronRight} flip className="text-muted-foreground size-4" />
        )}
      </Pressable>

      {hint !== undefined ? (
        <Text variant="metaSm" className="text-muted-foreground">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

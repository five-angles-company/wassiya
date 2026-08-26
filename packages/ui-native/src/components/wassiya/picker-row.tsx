import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * One choice in a list of choices — the six asset types, and anything shaped
 * like them.
 *
 * Deliberately the **same row as the vault list**, so the picker reads as that
 * list's own vocabulary rather than as a menu bolted on beside it. Same tile,
 * same gap, same inset hairline; only the second line changes job, from "who
 * receives this" to "what belongs here".
 *
 * ## Examples, not definitions
 *
 * The second line is the point of the screen. "بريد، متجر، بث" tells someone
 * where a Netflix login goes; "digital account" never will. Whoever writes
 * these should reach for three concrete things, not a category.
 *
 * There is no chevron. Every row here obviously leads somewhere, so an arrow
 * on each one is six arrows carrying no information — and the whole row is the
 * target anyway.
 */
export type PickerRowProps = {
  icon: LucideIcon;
  title: string;
  /** Three examples, ideally. */
  examples: string;
  /** Dimmed and inert — a lapsed subscription pauses adding, nothing else. */
  disabled?: boolean;
  divider?: boolean;
  onPress: () => void;
  className?: string;
};

export function PickerRow({
  icon,
  title,
  examples,
  disabled = false,
  divider,
  onPress,
  className,
}: PickerRowProps) {
  return (
    <View className={className}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        className={cn(
          'flex-row items-center gap-[14px] py-3.5',
          disabled ? 'opacity-40' : 'active:opacity-70'
        )}>
        <View className="bg-card size-[42px] shrink-0 items-center justify-center rounded-[14px]">
          <Icon as={icon} size={20} strokeWidth={2.75} className="text-terracotta-800" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-body-semibold text-foreground text-[16px]">{title}</Text>
          <Text numberOfLines={1} className="mt-0.5 text-[11.5px] opacity-50">
            {examples}
          </Text>
        </View>
      </Pressable>
      {divider ? <View className="bg-border ms-[56px] h-px" /> : null}
    </View>
  );
}

import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, Users } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * One possible recipient, with a tick on the end.
 *
 * Deliberately the **same row rhythm as the vault list** — 42px leading circle,
 * 14px gap, name over detail, inset hairline — so choosing who receives an
 * asset feels like the same object seen from another side rather than a
 * different kind of screen.
 *
 * ## The face is the state
 *
 * A chosen heir wears an olive disc with their initial; an unchosen one wears
 * the surface fill at 70%. The tick on the end says the same thing a second
 * time, which is the point: the row reads at a glance from either end.
 *
 * ## "كل الورثة" is not a person
 *
 * The shared bucket gets an icon, never a letter. Giving a category an initial
 * makes it look like somebody, and this is the one row where confusing a group
 * for a person changes who inherits what.
 */
export type RecipientRowProps = {
  name: string;
  /** The relation — "بنت", "ابن" — or a note for the non-person destinations. */
  detail?: string;
  selected: boolean;
  onToggle: () => void;
  /** Draws the icon disc instead of an initial. */
  group?: boolean;
  divider?: boolean;
  className?: string;
};

export function RecipientRow({
  name,
  detail,
  selected,
  onToggle,
  group = false,
  divider,
  className,
}: RecipientRowProps) {
  return (
    <View className={className}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={name}
        className="flex-row items-center gap-[14px] py-[13px] active:opacity-70">
        <View
          className={cn(
            'size-[42px] shrink-0 items-center justify-center rounded-full',
            group
              ? 'bg-card'
              : selected
                ? 'bg-olive-200'
                : 'bg-card opacity-70'
          )}>
          {group ? (
            <Icon as={Users} size={19} strokeWidth={2.75} className="text-terracotta-800" />
          ) : (
            <Text className="font-body-bold text-olive-900 text-[16px]">
              {[...name.trim()][0] ?? '?'}
            </Text>
          )}
        </View>

        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-body-semibold text-foreground text-[15.5px]">
            {name}
          </Text>
          {detail !== undefined ? (
            <Text numberOfLines={1} className="mt-0.5 text-[11.5px] opacity-50">
              {detail}
            </Text>
          ) : null}
        </View>

        <View
          className={cn(
            'size-[27px] shrink-0 items-center justify-center rounded-full',
            selected ? 'bg-secondary' : 'border-sand-400 border-[2.25px]'
          )}>
          {selected ? (
            <Icon as={Check} size={15} strokeWidth={3} className="text-background" />
          ) : null}
        </View>
      </Pressable>
      {divider ? <View className="bg-border ms-[56px] h-px" /> : null}
    </View>
  );
}

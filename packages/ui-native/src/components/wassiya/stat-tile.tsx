import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { TONE_DISC_BG, TONE_DISC_FG, TONE_SOFT_FG, type Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * One square of the home grid: a number, or a state, and what it's about.
 *
 * ## The layout, after seeing it on glass
 *
 * The first version stacked icon → label → value down the start edge. On a
 * ~150dp tile that left most of the width empty and made every tile twice as
 * tall as its content, so five of them filled a screen and said very little.
 *
 * The icon and the value now share the top row — icon on the start edge, value
 * on the end — with the label underneath. The tile uses its width, halves its
 * height, and the values line up in a column down the grid, which is what makes
 * a set of numbers scannable rather than merely present.
 *
 * ## Why one component covers counts and states
 *
 * Half these tiles report a quantity ("١") and half a condition ("غير مفعّل").
 * They must share a silhouette or the grid stops reading as a set — and the
 * whole reason a grid works here is that the eye can sweep it. `emphasis`
 * decides only how loudly the value is drawn: `count` for numerals, which are
 * short and deserve the size, `state` for words, which are not.
 *
 * ## Tone is the message
 *
 * Terracotta means "this needs you", olive means done, sand is just a number.
 * The gaps are findable by colour before a single word is read, which is what
 * lets the labels stay this short.
 */
export type StatTileProps = {
  icon: LucideIcon;
  /** What this is about: "الأصول", "الوصي". One or two words. */
  label: string;
  /** A numeral, or a short state word. */
  value: string;
  /** `count` draws the value large; `state` keeps it at row weight. */
  emphasis?: 'count' | 'state';
  /** terracotta = needs you · olive = done · sand = neutral. */
  tone?: Tone;
  onPress?: () => void;
  className?: string;
};

export function StatTile({
  icon,
  label,
  value,
  emphasis = 'state',
  tone = 'sand',
  onPress,
  className,
}: StatTileProps) {
  return (
    <Pressable
      accessibilityRole={onPress === undefined ? undefined : 'button'}
      onPress={onPress}
      // `basis-[47%]` + `grow` is what puts two on a row with a gap between
      // them: a hard 50% cannot fit alongside the gap and wraps to one column.
      className={cn(
        'rounded-card bg-card grow basis-[47%] gap-2.5 px-4 py-3.5',
        onPress !== undefined && 'active:bg-sand-300',
        className
      )}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View
          className={cn(
            'size-9 shrink-0 items-center justify-center rounded-full',
            TONE_DISC_BG[tone]
          )}
        >
          <Icon as={icon} size={18} strokeWidth={2.75} className={TONE_DISC_FG[tone]} />
        </View>

        <Text
          variant={emphasis === 'count' ? 'screenTitle' : 'rowTitle'}
          numberOfLines={1}
          className={cn('shrink text-end', TONE_SOFT_FG[tone])}
        >
          {value}
        </Text>
      </View>

      <Text variant="metaSm" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

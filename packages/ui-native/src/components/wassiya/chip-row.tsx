import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { Pressable, View } from 'react-native';

/**
 * A short one-of-N choice, as pills — the only chip in the app.
 *
 * The rule, exactly: chips are pills on `--color-surface`, and the
 * selected one is **solid terracotta**. Not an outline, not a tint — the same
 * fill the primary button uses, because a chosen chip and a live button are the
 * same kind of statement.
 *
 * Used where the options are few and short enough to read at once: a network, a
 * cadence, handed over or private. Anything longer than a couple of words per
 * option belongs in a `SheetSelect`, which opens a sheet instead of wrapping to
 * three lines.
 *
 * `value` may be `null`, and that is a real state rather than a defensive one:
 * ٤.٧ ships no default disposition on purpose, because a default would quietly
 * decide something people feel strongly about.
 */
export type Chip = { value: string; label: string };

export type ChipRowProps = {
  options: Chip[];
  value: string | null;
  onChange: (value: string) => void;
  /** A label above the chips, drawn the way `Field` draws its own. */
  label?: string;
  /**
   * Equal-width options across the row, taller — for a setting of two or
   * three values that deserves the width, not a scatter of small pills.
   */
  fill?: boolean;
  className?: string;
};

export function ChipRow({ options, value, onChange, label, fill = false, className }: ChipRowProps) {
  const chips = (
    <View
      accessibilityRole="radiogroup"
      className={cn(
        fill ? 'flex-row gap-2' : 'flex-row flex-wrap gap-[7px]',
        label === undefined && className
      )}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              'rounded-full',
              fill ? 'flex-1 items-center py-3.5' : 'px-[15px] py-2',
              selected ? 'bg-primary' : 'bg-card active:opacity-70'
            )}>
            <Text
              className={cn(
                fill ? 'text-row' : 'text-[12.5px]',
                selected ? 'font-body-semibold text-background' : 'text-foreground'
              )}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
  if (label === undefined) return chips;
  return (
    <View className={cn('gap-2', className)}>
      <Text variant="meta">{label}</Text>
      {chips}
    </View>
  );
}

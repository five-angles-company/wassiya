import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { Pressable, View } from 'react-native';

/**
 * A short one-of-N choice, as pills.
 *
 * The rule, exactly: chips are pills on `--color-surface`, and the
 * selected one is **solid terracotta**. Not an outline, not a tint — the same
 * fill the primary button uses, because a chosen chip and a live button are the
 * same kind of statement.
 *
 * Used where the options are few and short enough to read at once: a network, a
 * document kind, an account type. Anything longer than a couple of words per
 * option belongs in a `ChoiceField`, which opens a sheet instead of wrapping to
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
  className?: string;
};

export function ChipRow({ options, value, onChange, className }: ChipRowProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      className={cn('flex-row flex-wrap gap-[7px]', className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              'rounded-full px-[15px] py-2',
              selected ? 'bg-primary' : 'bg-card active:opacity-70'
            )}>
            <Text
              className={cn(
                'text-[12.5px]',
                selected ? 'font-body-semibold text-background' : 'text-foreground'
              )}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

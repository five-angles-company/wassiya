import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import type * as React from 'react';
import { Pressable, View } from 'react-native';

/**
 * One field on an asset or wizard screen: a label over its value, on a hairline.
 * The vault's core unit — *"no boxed inputs, no cards, except around a
 * secret or the recipient set"* — and the reason those screens read as pages
 * rather than stacks of panels.
 *
 * Editing has no mode: tapping a value edits it. The focused row takes a 2px
 * terracotta rule under its value and turns its label terracotta, and every
 * other row drops to 45% — which focuses the screen without dimming it into a
 * modal.
 *
 * A control in `trailing` **stays put when the row is not active**: the rule is
 * explicit that Reveal greys out rather than disappearing, so its position never
 * moves and nobody hunts for it.
 *
 * Three levels of protection, three sizes of control — a seed phrase gets a
 * filled Reveal, a password a plain eye, an address nothing. No copy explains
 * the difference because the controls do, which is why `trailing` is a slot
 * rather than a boolean.
 */
export type FieldRowProps = {
  /** 12px at 50%; terracotta and semibold while `active`. */
  label: string;
  /** Sits at the end of the label line — "تُعدّل الآن" on the row being edited. */
  hint?: string;
  /** This row has focus. */
  active?: boolean;
  /** Another row has focus, so this one recedes rather than vanishing. */
  dimmed?: boolean;
  /** On the value line, after the value: a Reveal pill, an eye, a copy icon. */
  trailing?: React.ReactNode;
  /** The value — a `TextInput`, a masked run, a paragraph. */
  children: React.ReactNode;
  /** Hairline under the row. Omit on the last one in a group. */
  divider?: boolean;
  onPress?: () => void;
  className?: string;
};

export function FieldRow({
  label,
  hint,
  active = false,
  dimmed = false,
  trailing,
  children,
  divider,
  onPress,
  className,
}: FieldRowProps) {
  const Row = onPress ? Pressable : View;
  return (
    <View className={className}>
      <Row
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={label}
        className={cn('py-3.5', dimmed && 'opacity-45')}>
        <View className="mb-[7px] flex-row items-baseline gap-2">
          <Text
            numberOfLines={1}
            className={cn(
              'min-w-0 flex-1 text-[12px] leading-[1.4]',
              active ? 'text-terracotta-800 font-body-semibold' : 'opacity-50'
            )}>
            {label}
          </Text>
          {hint !== undefined ? (
            <Text className="text-terracotta-800 shrink-0 text-[11px] opacity-80">
              {hint}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center gap-3">
          <View
            className={cn(
              'min-w-0 flex-1',
              // The rule belongs to the value, not the row: it marks what is
              // being typed into, and a full-width underline would read as a
              // divider in a list that already has hairlines.
              active && 'border-primary border-b-2 pb-[9px]'
            )}>
            {children}
          </View>
          {trailing}
        </View>
      </Row>
      {divider ? <View className="bg-border h-px" /> : null}
    </View>
  );
}

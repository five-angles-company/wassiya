import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

/**
 * A label over a short value, sized to share a row with its siblings.
 *
 * The bank asset puts type, currency and branch on one line rather than on
 * three: they are each two words long, and three full-width rows for six words
 * is what makes a form feel like paperwork. `FieldRow` owns the padding and the
 * hairline; this owns only the pair, so a row can hold one or three of them.
 *
 * `dim` marks a value the owner did not type — the currency is derived from the
 * country and cannot be edited, so it reads at 55% and nobody taps it expecting
 * a keyboard.
 */
export type FieldCellProps = {
  label: string;
  value: string;
  /** Derived rather than entered. */
  dim?: boolean;
  /** Latin runs stay left-to-right inside the RTL row. */
  ltr?: boolean;
  className?: string;
};

export function FieldCell({ label, value, dim, ltr, className }: FieldCellProps) {
  return (
    <View className={cn('min-w-0 flex-1', className)}>
      <Text numberOfLines={1} className="mb-1.5 text-[12px] opacity-50">
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={ltr ? { writingDirection: 'ltr' } : undefined}
        className={cn('font-body-semibold text-foreground text-[16px]', dim && 'opacity-55')}>
        {value}
      </Text>
    </View>
  );
}

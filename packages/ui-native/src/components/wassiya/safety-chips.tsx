import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

export type SafetyChipsProps = {
  /** Short, already-localised claims: "لقطات الشاشة محجوبة", "لا ذاكرة للوحة المفاتيح". */
  items: string[];
  className?: string;
};

/**
 * The row of small terracotta chips under a guarded field, naming the
 * protections that are actually in force on that screen.
 *
 * These are **claims about behaviour**, not decoration: only list a chip whose
 * protection the screen really applies (FLAG_SECURE, no keyboard learning,
 * clipboard wipe). A chip that promises something the code does not do is
 * worse than no chip.
 */
export function SafetyChips({ items, className }: SafetyChipsProps) {
  if (!items.length) return null;
  return (
    <View className={cn('flex-row flex-wrap gap-1.5', className)}>
      {items.map((item) => (
        <View key={item} className="bg-terracotta-200 rounded-full px-2.5 py-1">
          <Text className="text-terracotta-900 text-kicker">{item}</Text>
        </View>
      ))}
    </View>
  );
}

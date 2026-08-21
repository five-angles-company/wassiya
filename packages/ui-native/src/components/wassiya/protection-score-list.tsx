import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { StatusPill } from '@workspace/ui-native/components/wassiya/status-pill';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export type ProtectionItem = {
  id: string;
  /** Already-localised name: "هويتك موثّقة", "وثيقة الاسترداد مطبوعة". */
  label: string;
  done: boolean;
  /**
   * Rank of an outstanding item. `needed` takes the terracotta pill; `later`
   * takes the sand one. Only ONE `needed` item should be pending at a time —
   * ranking is what makes the amber mean anything.
   */
  priority?: 'needed' | 'later';
  /** Text of the trailing pill, when pending. */
  pillLabel?: string;
  onPress?: () => void;
};

export type ProtectionScoreListProps = {
  items: ProtectionItem[];
  className?: string;
};

/**
 * The row-list form of the protection score — the same five items the chip
 * summarises, as a to-do list.
 *
 * Completed rows take an olive fill and a check; pending rows stay on the card
 * ground with a hollow disc, so "done" reads at a glance without needing to
 * parse any text.
 */
export function ProtectionScoreList({ items, className }: ProtectionScoreListProps) {
  return (
    <View className={cn('gap-row', className)}>
      {items.map((item) => {
        const Row = item.onPress ? Pressable : View;
        return (
          <Row
            key={item.id}
            onPress={item.onPress}
            accessibilityRole={item.onPress ? 'button' : undefined}
            className={cn(
              'flex-row items-center gap-2.75 rounded-row px-4 py-3.5',
              item.done ? 'bg-olive-100' : 'bg-card'
            )}>
            {item.done ? (
              <Icon as={Check} className="text-olive-800 size-4.5" />
            ) : (
              <View className="border-sand-500 size-4.5 shrink-0 rounded-full border-[2.75px]" />
            )}
            <Text
              className={cn('flex-1 text-notice', item.done ? 'text-olive-800' : 'text-foreground')}>
              {item.label}
            </Text>
            {!item.done && item.pillLabel ? (
              <StatusPill status={item.priority === 'needed' ? 'action' : 'waiting'}>
                {item.pillLabel}
              </StatusPill>
            ) : null}
          </Row>
        );
      })}
    </View>
  );
}

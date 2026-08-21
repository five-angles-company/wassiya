import { Icon } from '@workspace/ui-native/components/ui/icon';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, Heart } from 'lucide-react-native';
import { View } from 'react-native';

export type HeartBadgeProps = {
  /** Swap the heart for a check once the owner has confirmed. */
  confirmed?: boolean;
  className?: string;
};

/**
 * The concentric sage badge at the centre of the check-in prompt (6.4):
 * 220px olive-100 ring, a 166px olive-200 ring inside it, and a 112px solid
 * olive disc carrying the glyph.
 *
 * The rings read as a slow pulse held still. Deliberately **not animated** for
 * v1 — a beating heart on the screen that asks whether you are alive is a
 * different, much worse thing than a calm one.
 */
export function HeartBadge({ confirmed, className }: HeartBadgeProps) {
  return (
    <View className={cn('bg-olive-100 size-55 items-center justify-center rounded-full', className)}>
      <View className="bg-olive-200 size-41.5 items-center justify-center rounded-full">
        <View className="bg-secondary size-28 items-center justify-center rounded-full shadow-md">
          <Icon
            as={confirmed ? Check : Heart}
            className="text-background size-13"
            strokeWidth={confirmed ? 3.5 : 2.75}
          />
        </View>
      </View>
    </View>
  );
}

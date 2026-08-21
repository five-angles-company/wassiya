import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { TONE_DISC_BG, TONE_DISC_FG, type Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export type AssetTypeTileProps = {
  icon: LucideIcon;
  /** "عملات رقمية", "حساب بنكي", … */
  title: string;
  /** What the form will ask for: "محافظ ومنصات". */
  description?: string;
  /**
   * Icon tint, grouping the six types by what they hold:
   * terracotta = secrets, olive = files, sand = instructions.
   */
  tone?: Tone;
  onPress?: () => void;
  className?: string;
};

/** One picker tile in {@link AssetTypeGrid}. */
export function AssetTypeTile({
  icon,
  title,
  description,
  tone = 'sand',
  onPress,
  className,
}: AssetTypeTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={cn('bg-card active:bg-sand-300 flex-1 gap-2.5 rounded-row p-4', className)}>
      <View
        className={cn(
          'size-9.5 items-center justify-center rounded-full',
          TONE_DISC_BG[tone]
        )}>
        <Icon as={icon} className={cn('size-4.5', TONE_DISC_FG[tone])} />
      </View>
      <View className="gap-0.5">
        <Text variant="rowTitle">{title}</Text>
        {description ? <Text variant="metaSm">{description}</Text> : null}
      </View>
    </Pressable>
  );
}

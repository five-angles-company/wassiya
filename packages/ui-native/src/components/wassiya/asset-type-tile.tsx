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
   * Icon tint. Defaults to sand and every caller so far takes the default: a
   * grouping map exists (terracotta = secrets, olive = files) but terracotta
   * means **"needs you"** on Home and in the vault list, and a terracotta tile
   * here would read as urgent when nothing on this screen is. The icons already
   * tell the six apart.
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
      className={cn(
        // `StatTile`'s metrics, so a type tile and a Home tile are the same
        // object rather than two things that merely resemble each other.
        'bg-card active:bg-sand-300 rounded-card flex-1 gap-2.5 px-4 py-3.5',
        className
      )}>
      <View
        className={cn(
          'size-9 items-center justify-center rounded-full',
          TONE_DISC_BG[tone]
        )}>
        <Icon as={icon} size={18} strokeWidth={2.75} className={TONE_DISC_FG[tone]} />
      </View>
      <View className="gap-0.5">
        <Text variant="rowTitle">{title}</Text>
        {description ? <Text variant="metaSm">{description}</Text> : null}
      </View>
    </Pressable>
  );
}

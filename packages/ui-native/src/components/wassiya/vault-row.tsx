import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { TONE_DISC_BG, TONE_DISC_FG } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import { Lock, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * One asset in the vault list — a full-width `StatTile`, on the surface Home
 * already uses: `rounded-card bg-card px-4 py-3.5`, a 36px round tone disc, a
 * name over a quiet second line. Cards separate themselves, so there are no
 * hairlines.
 *
 * A private asset is an owner's choice, not a fault, so it is marked with a
 * quiet lock rather than terracotta — the colour this product keeps for
 * something that still needs fixing.
 */
export type VaultRowProps = {
  icon: LucideIcon;
  /** The decrypted asset name. */
  title: string;
  /** The handover line — "يُسلَّم للوصي" or "خاص". */
  detail: string;
  /** Marks the row private with a lock. */
  isPrivate?: boolean;
  onPress?: () => void;
  className?: string;
};

export function VaultRow({ icon, title, detail, isPrivate = false, onPress, className }: VaultRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn(
        'rounded-card bg-card border border-border flex-row items-center gap-3 px-4 py-3.5',
        onPress && 'active:bg-sand-300',
        className
      )}>
      <View
        className={cn(
          'size-9 shrink-0 items-center justify-center rounded-full',
          TONE_DISC_BG.sand
        )}>
        <Icon as={icon} size={18} strokeWidth={2.75} className={TONE_DISC_FG.sand} />
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="rowTitle" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="metaSm" numberOfLines={1}>
          {detail}
        </Text>
      </View>

      {isPrivate ? (
        <Icon as={Lock} size={16} strokeWidth={2.5} className="shrink-0 text-muted-foreground" />
      ) : null}
    </Pressable>
  );
}

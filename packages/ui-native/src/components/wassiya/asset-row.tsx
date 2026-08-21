import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import {
  StatusPill,
  type StatusPillStatus,
} from '@workspace/ui-native/components/wassiya/status-pill';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export type AssetRowProps = {
  icon: LucideIcon;
  /** Decrypted title. Decrypt lazily, per visible row — never the whole list. */
  title: string;
  /** Type, chain, masked IBAN, file size — whatever identifies it at a glance. */
  meta?: string;
  /** Recipient state. `action` = "بلا مستلم", the one thing a user must fix. */
  recipientStatus?: StatusPillStatus;
  recipientLabel?: string;
  onPress?: () => void;
  className?: string;
};

/**
 * A single asset in the vault list.
 *
 * The recipient badge is the **only** status this row shows. An unrouted asset
 * takes the terracotta pill because it is a genuine warning — a vault that
 * delivers nothing is the outcome this product exists to prevent — while a
 * routed one takes olive and recedes.
 *
 * `title` and `meta` arrive already decrypted. Count and type are plaintext
 * metadata, so the list can render before any decryption; the strings cannot.
 */
export function AssetRow({
  icon,
  title,
  meta,
  recipientStatus,
  recipientLabel,
  onPress,
  className,
}: AssetRowProps) {
  const Row = onPress ? Pressable : View;
  return (
    <Row
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn(
        'bg-card flex-row items-center gap-3 rounded-row px-4 py-3.5',
        onPress && 'active:bg-sand-300',
        className
      )}>
      <View className="bg-background size-10 shrink-0 items-center justify-center rounded-full">
        <Icon as={icon} className="text-terracotta-700 size-4.5" />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="rowTitle" numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <Text variant="metaSm" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {recipientStatus && recipientLabel ? (
        <StatusPill status={recipientStatus}>{recipientLabel}</StatusPill>
      ) : null}
    </Row>
  );
}

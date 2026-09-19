import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

export type KeyCardProps = {
  icon: LucideIcon;
  /** Which key this is: "هذا الجهاز", "ورقة مطبوعة", "وصيّك". */
  title: string;
  /** What it does, in one line. */
  description: string;
  /** Dimmed treatment for a key that is not enrolled yet. */
  pending?: boolean;
  className?: string;
};

/**
 * One of the three keys to the vault, in the 2-of-3 explainer.
 *
 * The cards **are** the explainer's subjects — device, printed sheet, heirs —
 * and each one names a later step in setup, so the explainer doubles as a map
 * of what is coming. Copy must never describe the vault as having "one key":
 * the whole recovery model is that no single key opens it.
 */
export function KeyCard({ icon, title, description, pending, className }: KeyCardProps) {
  return (
    <View
      className={cn(
        'bg-card border border-border flex-row gap-3 rounded-row px-4 py-3.5',
        pending && 'opacity-60',
        className
      )}>
      <View className="bg-background size-9.5 shrink-0 items-center justify-center rounded-full">
        <Icon as={icon} className="size-4.5" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="rowTitle">{title}</Text>
        <Text variant="meta" className="text-muted-foreground">
          {description}
        </Text>
      </View>
    </View>
  );
}

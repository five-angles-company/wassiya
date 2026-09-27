import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import type * as React from 'react';
import { View } from 'react-native';

export type EmptyStateProps = {
  icon: LucideIcon;
  /** One honest sentence: "لا نشاط بعد". */
  title: string;
  /** What to do about it, when there is something to do. */
  subtitle?: string;
  /** At most one action. */
  action?: React.ReactNode;
  className?: string;
};

/**
 * An empty list inside a screen that already has its header — the audit log,
 * devices, notifications. A card in the list's own place, so the screen keeps
 * its shape when there is nothing to show.
 *
 * Olive, never terracotta: an empty list is a normal first day, not an error.
 * A whole screen that is empty on first run (the vault, the executors) has its
 * own composed empty state instead.
 */
export function EmptyState({ icon, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <View className={cn('rounded-card bg-card items-center gap-3 px-5 py-8', className)}>
      <View className="bg-olive-100 size-12 items-center justify-center rounded-full">
        <Icon as={icon} className="text-olive-800 size-5.5" />
      </View>
      <Text variant="title" className="text-center">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="proseSm" className="text-center">
          {subtitle}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

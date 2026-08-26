import { Icon } from '@workspace/ui-native/components/ui/icon';
import { cn } from '@workspace/ui-native/lib/utils';
import { ChevronRight, X, type LucideIcon } from 'lucide-react-native';
import type * as React from 'react';
import { Pressable, View } from 'react-native';

/**
 * The top of every vault screen: a 40px round back button, and one thing on the
 * other end.
 *
 * Both ways out of a screen live in fixed positions, which is what lets the
 * asset screen swap its trailing control — an overflow menu at rest, "إلغاء"
 * while editing — without the owner having to look for either. Nothing moves;
 * only the thing in the slot changes.
 *
 * The chevron is authored as `ChevronRight` and flipped, so it points the way
 * the reading direction came from: right in Arabic, left in English.
 */
export type ScreenTopProps = {
  /** Accessible name for the back control. */
  backLabel: string;
  /**
   * A chevron goes back; an X dismisses. The type picker uses the X, because
   * it is a decision you abandon rather than a place you retreat from — and an
   * X never mirrors, where a chevron must.
   */
  back?: 'chevron' | 'close';
  onBack: () => void;
  /** A round icon button on the far end — the overflow menu. */
  action?: { icon: LucideIcon; label: string; onPress: () => void };
  /** Text in the same slot, used for "إلغاء". Wins over `action`. */
  trailing?: React.ReactNode;
  className?: string;
};

export function ScreenTop({
  backLabel,
  back = 'chevron',
  onBack,
  action,
  trailing,
  className,
}: ScreenTopProps) {
  const chevron = back === 'chevron';
  return (
    <View className={cn('flex-row items-center gap-3', className)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        onPress={onBack}
        className="bg-card size-10 shrink-0 items-center justify-center rounded-full active:opacity-70">
        <Icon
          as={chevron ? ChevronRight : X}
          flip={chevron}
          size={19}
          strokeWidth={2.75}
          className="text-foreground"
        />
      </Pressable>

      <View className="flex-1" />

      {trailing ??
        (action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            className="bg-card size-10 shrink-0 items-center justify-center rounded-full active:opacity-70">
            <Icon as={action.icon} size={19} strokeWidth={2.75} className="text-foreground" />
          </Pressable>
        ) : null)}
    </View>
  );
}


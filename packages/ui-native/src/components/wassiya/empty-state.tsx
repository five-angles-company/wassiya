import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import type * as React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

export type EmptyStateProps = {
  /** Glyph for the sage disc. Ignored when `illustration` is given. */
  icon?: LucideIcon;
  /** Custom artwork in place of the icon blob. */
  illustration?: React.ReactNode;
  /** One honest sentence: "خزنتك فارغة — وهذا طبيعي". */
  title: string;
  /** What to do about it, and what most people do first. */
  subtitle?: string;
  /** The single primary CTA. */
  action?: React.ReactNode;
  /** One quiet secondary link under it. */
  secondaryAction?: React.ReactNode;
  className?: string;
};

/**
 * The template for every empty list in the app — assets, heirs, guardians,
 * notifications.
 *
 * Three rules: a **sage** disc (never terracotta — an
 * empty vault is a normal first day, not an error), exactly **one** honest
 * sentence, and exactly **one** primary CTA with at most one quiet secondary.
 * An empty state that offers three equal choices is a menu, not a nudge.
 */
export function EmptyState({
  icon,
  illustration,
  title,
  subtitle,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const reduced = useReducedMotion();

  return (
    <View className={cn('items-center justify-center gap-5 px-gutter py-10', className)}>
      {illustration ?? (
        /*
          A **solid** disc, not a pale wash.

          This was a 160px `olive-100` circle — a few percent off the page —
          carrying a dark glyph. At that size a near-background fill reads as
          absence rather than illustration, which is the wrong note for a screen
          whose whole job is to say "this is fine, here is what to do". A
          smaller disc in solid sage with a cream glyph is warmer, more
          confident, and speaks the same language as the check-in heart.
        */
        <Animated.View entering={reduced ? undefined : FadeInDown.duration(320)}>
          <View className="bg-secondary size-28 items-center justify-center rounded-full shadow-md">
            {icon ? (
              <Icon as={icon} className="text-secondary-foreground size-12" />
            ) : null}
          </View>
        </Animated.View>
      )}

      <View className="items-center gap-2">
        <Text variant="dialogTitle" className="text-center">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="p" className="text-muted-foreground max-w-72 text-center">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {action}
      {secondaryAction}
    </View>
  );
}

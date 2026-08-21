import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { TONE_SOFT_BG, type Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, Info, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import type * as React from 'react';
import { View } from 'react-native';

export type AlertBannerVariant =
  /** Terracotta + warning glyph — a security event the user must judge. */
  | 'security'
  /**
   * Terracotta + info glyph — a standing rule or consequence the user should
   * weigh but cannot act on right now: the 5.3 default-routing rule, the 9.4
   * subscription-lapse notice.
   */
  | 'notice'
  /** Sand — neutral context, said once and then ignorable. */
  | 'info'
  /** Olive — something is confirmed and safe. */
  | 'success';

const VARIANT_TONE: Record<AlertBannerVariant, Tone> = {
  security: 'terracotta',
  notice: 'terracotta',
  info: 'sand',
  success: 'olive',
};

const VARIANT_ICON: Record<AlertBannerVariant, LucideIcon> = {
  security: TriangleAlert,
  notice: Info,
  info: Info,
  success: Check,
};

const VARIANT_FG: Record<AlertBannerVariant, string> = {
  security: 'text-terracotta-900',
  notice: 'text-terracotta-900',
  info: 'text-sand-800',
  success: 'text-olive-900',
};

export type AlertBannerProps = {
  variant?: AlertBannerVariant;
  /** Bold first line. Omit for a single-paragraph notice. */
  title?: string;
  /** The body copy. */
  description: string;
  /** Override the default glyph. */
  icon?: LucideIcon;
  /**
   * Paired actions, e.g. "لم أكن أنا" / "كنت أنا". Render `Button`s with
   * `size="xs"`; they sit inside the banner's tint.
   */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * The tinted notice block used for security events, standing rules, and
 * confirmations.
 *
 * `security` banners carry their actions **inline**. A recovery attempt from an
 * unknown device is only actionable at the moment it is read; making the user
 * navigate elsewhere to say "wasn't me" is how an account gets taken over
 * while the warning sits unread in a list.
 */
export function AlertBanner({
  variant = 'info',
  title,
  description,
  icon,
  actions,
  className,
}: AlertBannerProps) {
  const tone = VARIANT_TONE[variant];
  const fg = VARIANT_FG[variant];
  return (
    <View className={cn('flex-row gap-3 rounded-row p-4', TONE_SOFT_BG[tone], className)}>
      <Icon as={icon ?? VARIANT_ICON[variant]} className={cn('mt-0.5 size-5 shrink-0', fg)} />
      <View className="flex-1 gap-1.5">
        {title ? <Text className={cn('font-body-bold text-notice', fg)}>{title}</Text> : null}
        <Text className={cn('text-meta', fg)}>{description}</Text>
        {actions ? <View className="mt-1.5 flex-row gap-2">{actions}</View> : null}
      </View>
    </View>
  );
}

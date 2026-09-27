import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { NATIVE_COLOR } from '@workspace/ui-native/lib/native-colors';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';

/**
 * Every full-width action in the app: 56px, pill, Cairo 800 at 17px.
 *
 * - `primary` — terracotta, the one action that moves the owner forward.
 * - `quiet` — surface-filled, the calm alternative beside it ("أبقِه", "إلغاء").
 * - `danger` — outlined in terracotta, for what cannot be undone. There is no
 *   red: a solid button means *proceed calmly*, so the destructive choice is
 *   the outlined one and keeping things is the filled one.
 *
 * **A disabled primary is surface-toned, never faded terracotta.** A greyed
 * accent reads as broken; a surface-toned one reads as waiting. Pass
 * `disabledLabel` wherever the blocker can be named, so the button explains
 * its own refusal ("اختر واحداً للمتابعة") instead of restating the action.
 */
export type PrimaryCtaProps = {
  label: string;
  /** Shown while `disabled` — name the blocker, don't restate the action. */
  disabledLabel?: string;
  /** Leads the label. A plus on "أضف", a fingerprint on "افتح ببصمتك". */
  icon?: LucideIcon;
  /** The glyph is drawn at 20px unless a caller overrides it. */
  iconSize?: number;
  tone?: 'primary' | 'quiet' | 'danger';
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
};

const SURFACE = {
  primary: 'bg-primary active:bg-terracotta-600',
  quiet: 'bg-card active:opacity-80',
  danger: 'border-primary border-[1.5px] active:opacity-70',
} as const;

const LABEL = {
  primary: 'text-background',
  quiet: 'text-foreground',
  danger: 'text-terracotta-800',
} as const;

export function PrimaryCta({
  label,
  disabledLabel,
  icon,
  iconSize = 20,
  tone = 'primary',
  onPress,
  disabled = false,
  busy = false,
  className,
}: PrimaryCtaProps) {
  const off = disabled || busy;
  const surface = off && tone === 'primary' ? 'bg-card' : SURFACE[tone];
  const labelClass = off ? 'text-foreground opacity-40' : LABEL[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      onPress={onPress}
      disabled={off}
      className={cn(
        'h-14 flex-row items-center justify-center gap-row rounded-full px-6',
        surface,
        className
      )}>
      {busy ? (
        <ActivityIndicator size="small" color={NATIVE_COLOR.mutedForeground} />
      ) : icon !== undefined ? (
        <Icon as={icon} size={iconSize} strokeWidth={2.75} className={labelClass} />
      ) : null}
      <Text numberOfLines={1} className={cn('font-heading-extrabold text-[17px]', labelClass)}>
        {disabled && disabledLabel !== undefined ? disabledLabel : label}
      </Text>
    </Pressable>
  );
}

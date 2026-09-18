import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';

/**
 * The one action at the bottom of a vault screen. 56px, pill, Cairo 800.
 *
 * ## A dead primary must not look like a broken one
 *
 * Disabled is **surface-toned**, not faded terracotta. A greyed-out accent
 * reads as "this button is malfunctioning"; a surface-toned one reads as "this
 * is waiting for you". That is deliberate, and it is why the
 * disabled state also gets its own label.
 *
 * ## The disabled label says what is missing
 *
 * ٤.٧ ships no default disposition on purpose, so its button reads
 * "اختر واحداً للمتابعة" until one is picked — the control explains its own
 * refusal instead of leaving the owner to hunt for the empty field. Pass
 * `disabledLabel` wherever the blocker is nameable; without one it just shows
 * `label`.
 */
export type PrimaryCtaProps = {
  label: string;
  /** Shown while `disabled` — name the blocker, don't restate the action. */
  disabledLabel?: string;
  /** Leads the label. A plus on "أضف", a fingerprint on "افتح ببصمتك". */
  icon?: LucideIcon;
  /** The glyph is drawn at 20px unless a caller overrides it. */
  iconSize?: number;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
};

export function PrimaryCta({
  label,
  disabledLabel,
  icon,
  iconSize = 20,
  onPress,
  disabled = false,
  busy = false,
  className,
}: PrimaryCtaProps) {
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      onPress={onPress}
      disabled={off}
      className={cn(
        'h-14 flex-row items-center justify-center gap-[9px] rounded-full',
        off ? 'bg-card' : 'bg-primary active:bg-terracotta-600',
        className
      )}>
      {busy ? (
        <ActivityIndicator size="small" color="#82796a" />
      ) : icon !== undefined ? (
        <Icon
          as={icon}
          size={iconSize}
          strokeWidth={2.75}
          className={off ? 'text-foreground opacity-40' : 'text-background'}
        />
      ) : null}
      <Text
        className={cn(
          'font-heading-extrabold text-[17px]',
          off ? 'text-foreground opacity-40' : 'text-background'
        )}>
        {disabled && disabledLabel !== undefined ? disabledLabel : label}
      </Text>
    </Pressable>
  );
}

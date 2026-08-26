import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { Fingerprint } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';

/**
 * The filled control that unhides the highest-stakes value on a screen.
 *
 * The board grades protection by the *size of the control*, not by copy: a seed
 * phrase gets this button, a password gets a plain eye, a storage location gets
 * nothing. Three levels, three affordances, no sentence needed to explain any
 * of them.
 *
 * The fingerprint is not decoration. This is the one reveal in the vault that
 * takes a biometric, because a phrase that leaks *is* the wallet — a password
 * that leaks is an afternoon. With the vault set to stay open while the app is,
 * this prompt is the last thing between a found phone and a drained one.
 *
 * ## Disabled means surface-toned, never a faded primary
 *
 * While another field is being edited this greys to the surface fill rather
 * than disappearing, so its position never moves and nobody has to hunt for it
 * after finishing an unrelated edit. A faded terracotta would read as broken;
 * a surface-toned control reads as waiting.
 */
export type RevealPillProps = {
  /** "إظهار" / "إخفاء". */
  label: string;
  onPress: () => void;
  /** Greys to surface and stops responding — see the note above. */
  disabled?: boolean;
  /** The biometric sheet is up. */
  busy?: boolean;
  className?: string;
};

export function RevealPill({
  label,
  onPress,
  disabled = false,
  busy = false,
  className,
}: RevealPillProps) {
  const quiet = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: quiet }}
      onPress={onPress}
      disabled={quiet}
      className={cn(
        'shrink-0 flex-row items-center gap-[7px] rounded-full px-[15px] py-[9px]',
        disabled
          ? 'bg-card opacity-50'
          : 'bg-primary active:bg-terracotta-600',
        className
      )}>
      {busy ? (
        <ActivityIndicator size="small" color="#f5ead8" />
      ) : (
        <Icon
          as={Fingerprint}
          size={15}
          strokeWidth={2.75}
          // `text-background`, not `text-primary-foreground`: the board fills
          // this glyph with --color-bg (#f5ead8), the page ground, and the
          // app's primary-foreground is the lighter #fff2eb.
          className={disabled ? 'text-foreground' : 'text-background'}
        />
      )}
      <Text
        className={cn(
          'shrink-0 text-[12px]',
          disabled
            ? 'font-body-semibold text-foreground'
            : 'font-body-bold text-background'
        )}>
        {label}
      </Text>
    </Pressable>
  );
}

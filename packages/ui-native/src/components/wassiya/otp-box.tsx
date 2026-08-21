import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import * as React from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { OtpInputState } from '@workspace/ui-native/components/wassiya/otp-input';

export type OtpBoxProps = {
  char: string;
  state: OtpInputState;
  focused: boolean;
};

/**
 * A single OTP cell: 60px tall, 20px radius, Cairo 800 at 26px — the board's
 * spec for `/auth/otp`.
 *
 * Two motions live here, both driven by `state`:
 *  - `verifying` pulses opacity, so a slow network reads as "working" rather
 *    than "frozen";
 *  - `wrong` shakes once, the physical gesture for rejection.
 *
 * The error tint is deep terracotta, not red — this palette has no red.
 */
export function OtpBox({ char, state, focused }: OtpBoxProps) {
  const pulse = useSharedValue(1);
  const shake = useSharedValue(0);

  React.useEffect(() => {
    if (state === 'verifying') {
      pulse.value = withRepeat(withTiming(0.45, { duration: 600 }), -1, true);
    } else {
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [state, pulse]);

  React.useEffect(() => {
    if (state !== 'wrong') return;
    shake.value = withSequence(
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [state, shake]);

  const animatedStyle = useAnimatedStyle(
    () => ({ opacity: pulse.value, transform: [{ translateX: shake.value }] }),
    [pulse, shake]
  );

  const errored = state === 'wrong' || state === 'expired';

  return (
    <Animated.View
      style={animatedStyle}
      className={cn(
        'h-15 flex-1 items-center justify-center rounded-box border',
        'bg-card border-border',
        focused && 'border-primary',
        errored && 'bg-terracotta-100 border-terracotta-400',
        state === 'lockedOut' && 'opacity-50'
      )}>
      <Text className={cn('font-heading-extrabold text-screen', errored && 'text-terracotta-800')}>
        {char}
      </Text>
    </Animated.View>
  );
}

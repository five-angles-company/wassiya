import { Icon } from '@workspace/ui-native/components/ui/icon';
import { cn } from '@workspace/ui-native/lib/utils';
import { Heart } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * The beating heart at the centre of the check-in.
 *
 * ## It is a real heartbeat, not a scale loop
 *
 * A single sine pulse reads as a notification badge demanding a tap. A heart
 * does **lub-dub**: a strong contraction, a quick lighter second one, then a
 * rest about twice as long as the two beats together. That rhythm is what the
 * eye recognises as *alive* rather than *urgent*, which matters a great deal on
 * a screen whose entire question is whether you still are. The timings below
 * are that shape — ~1.4s per cycle, roughly 43bpm, deliberately slower than a
 * resting pulse so it reads as calm.
 *
 * A ring ripples outward once per cycle and fades, the way a pulse travels.
 *
 * ## Animated transforms and colour are kept apart
 *
 * Uniwind styles components it has been taught about; `Animated.View` is not
 * one of them, so a `className` on it is silently dropped — the failure mode
 * being an invisible or uncoloured shape with no error anywhere. Every animated
 * wrapper here therefore carries **only** `style` (transform, opacity) and
 * holds a plain `View` that carries the colour classes.
 *
 * ## Reduced motion
 *
 * Honoured: when the OS asks for less motion the heart is drawn still. An
 * animation someone cannot tolerate is worse than no animation, and this one is
 * decorative — nothing it conveys is unavailable from the tone and the label.
 */
export type PulsingHeartProps = {
  /** Olive when the clock is healthy, terracotta when an answer is wanted. */
  tone?: 'olive' | 'terracotta';
  className?: string;
};

const SKIN = {
  olive: { halo: 'bg-olive-200', ring: 'bg-olive-300', disc: 'bg-secondary', icon: 'text-secondary-foreground' },
  terracotta: { halo: 'bg-terracotta-200', ring: 'bg-terracotta-300', disc: 'bg-primary', icon: 'text-primary-foreground' },
} as const;

export function PulsingHeart({ tone = 'olive', className }: PulsingHeartProps) {
  const beat = useSharedValue(1);
  const ripple = useSharedValue(0);
  const reduced = useReducedMotion();
  const skin = SKIN[tone];

  useEffect(() => {
    if (reduced) return;

    // lub · release · dub · release · rest
    beat.value = withRepeat(
      withSequence(
        withTiming(1.09, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 170, easing: Easing.in(Easing.quad) }),
        withTiming(1.05, { duration: 130, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 190, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 760 })
      ),
      -1,
      false
    );

    // One outward ripple per cycle, then a pause the length of the rest.
    ripple.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(beat);
      cancelAnimation(ripple);
    };
  }, [reduced, beat, ripple]);

  const beatStyle = useAnimatedStyle(() => ({ transform: [{ scale: beat.value }] }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: (1 - ripple.value) * 0.5,
    transform: [{ scale: 0.9 + ripple.value * 0.45 }],
  }));

  return (
    <View className={cn('size-36 items-center justify-center', className)}>
      {/* The travelling ripple, behind everything. */}
      <Animated.View style={[{ position: 'absolute' }, rippleStyle]}>
        <View className={cn('size-36 rounded-full', skin.ring)} />
      </Animated.View>

      {/* A still halo, so the shape still reads when motion is off. */}
      <View className={cn('absolute size-30 rounded-full', skin.halo)} />

      <Animated.View style={beatStyle}>
        <View
          className={cn(
            'size-21.5 items-center justify-center rounded-full shadow-md',
            skin.disc
          )}
        >
          <Icon as={Heart} size={38} strokeWidth={2.75} className={skin.icon} />
        </View>
      </Animated.View>
    </View>
  );
}

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
 * A real heartbeat, not a scale loop: a single sine pulse reads as a
 * notification badge demanding a tap, where **lub-dub** — a strong contraction,
 * a quick lighter second, then a rest about twice as long as the two together —
 * reads as *alive* rather than *urgent*, which is the entire question of the
 * screen. ~1.4s per cycle, roughly 43bpm, deliberately slower than a resting
 * pulse so it reads as calm.
 *
 * The disc and one expanding ring, nothing else. The ring is motion, and it is
 * gone from the frame most of the time.
 *
 * **Animated transforms and colour are kept apart.** Uniwind styles components
 * it has been taught about, and `Animated.View` is not one — a `className` on it
 * is silently dropped, giving an invisible or uncoloured shape with no error
 * anywhere. Every animated wrapper carries only `style`, and holds a plain
 * `View` that carries the colour classes.
 *
 * Reduced motion is honoured: the heart is drawn still, and nothing it conveys
 * is unavailable from the tone and the label.
 */
export type PulsingHeartProps = {
  /** Olive when the clock is healthy, terracotta when an answer is wanted. */
  tone?: 'olive' | 'terracotta';
  className?: string;
};

const SKIN = {
  olive: { ring: 'bg-olive-300', disc: 'bg-secondary', icon: 'text-secondary-foreground' },
  terracotta: { ring: 'bg-terracotta-300', disc: 'bg-primary', icon: 'text-primary-foreground' },
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

    // One ring out of the disc per cycle, then a pause the length of the rest.
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
    opacity: (1 - ripple.value) * 0.35,
    transform: [{ scale: 1 + ripple.value * 0.7 }],
  }));

  return (
    <View className={cn('size-15 items-center justify-center', className)}>
      <Animated.View style={[{ position: 'absolute' }, rippleStyle]}>
        <View className={cn('size-15 rounded-full', skin.ring)} />
      </Animated.View>

      <Animated.View style={beatStyle}>
        <View
          className={cn(
            'size-15 items-center justify-center rounded-full shadow-md',
            skin.disc
          )}
        >
          <Icon as={Heart} size={28} strokeWidth={2.75} className={skin.icon} />
        </View>
      </Animated.View>
    </View>
  );
}

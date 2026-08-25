import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { TONE_SOLID_BG, TONE_SOLID_FG, type Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * One asset, as a card in the vault grid.
 *
 * ## Colour, because beige on beige is not calm — it is invisible
 *
 * Every tile used to be `bg-card` on `bg-background`: two sand tones a few
 * percent apart, six of them, in a column. The grid had no rhythm and nothing
 * to land on. Each tile now takes a **soft fill from its own type** with a
 * **solid disc** at its corner, so a vault of mixed assets reads as a warm set
 * of distinct things rather than a wall of identical rectangles.
 *
 * `sand` fills with `bg-card` rather than `bg-sand-200`, which is within a few
 * percent of the page and would leave notes and bank rows looking like holes.
 *
 * The tint means **what this holds** — terracotta for secrets, olive for
 * encrypted files, sand for instructions — which is deliberately not what
 * terracotta means on a StatusPill. The two never collide because destination
 * lives on the group heading, never on the tile.
 *
 * ## Motion
 *
 * Tiles rise in on mount, staggered by their position, and spring down under a
 * finger. Both are small and both are the difference between a screen that
 * renders and one that feels handled. `useReducedMotion` turns off the
 * entrance; the press spring stays, because it is feedback rather than
 * decoration and its absence reads as an unresponsive control.
 *
 * ## Animated wrappers carry no className
 *
 * Uniwind styles components it has been taught about and `Animated.View` is
 * not one — a className on it is silently dropped, leaving an uncoloured shape
 * with no error. Every animated wrapper here carries only `style`; the colours
 * sit on plain `View`s inside.
 */
export type AssetTileProps = {
  icon: LucideIcon;
  /** The decrypted name. */
  title: string;
  /** What kind of thing it is: "مستند", "عملة رقمية". */
  category: string;
  /** From `ASSET_TYPE_TONE` — what the asset holds. */
  tone?: Tone;
  /** Position in its group, for the entrance stagger. */
  index?: number;
  onPress?: () => void;
  className?: string;
};

/** Soft fill per tone. `sand` uses the card colour — see the note above. */
const FILL: Record<Tone, string> = {
  terracotta: 'bg-terracotta-100',
  olive: 'bg-olive-100',
  sand: 'bg-card',
};

export function AssetTile({
  icon,
  title,
  category,
  tone = 'sand',
  index = 0,
  onPress,
  className,
}: AssetTileProps) {
  const pressed = useSharedValue(0);
  const reduced = useReducedMotion();

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.04 }],
  }));

  return (
    <Animated.View
      // 45ms apart: fast enough that a full grid finishes before a thumb can
      // reach it, slow enough to read as a sequence rather than a flicker.
      entering={reduced ? undefined : FadeInDown.delay(index * 45).duration(260)}
      style={[{ flexBasis: '47%' }, pressStyle]}
      className={className}
    >
      <Pressable
        accessibilityRole={onPress === undefined ? undefined : 'button'}
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withSpring(1, { damping: 18, stiffness: 260 });
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, { damping: 18, stiffness: 260 });
        }}
        className={cn('rounded-card gap-3 p-4 shadow-sm', FILL[tone])}
      >
        <View
          className={cn(
            'size-10 items-center justify-center rounded-full',
            TONE_SOLID_BG[tone]
          )}
        >
          <Icon as={icon} size={19} strokeWidth={2.75} className={TONE_SOLID_FG[tone]} />
        </View>

        <View className="gap-0.5">
          {/* Two lines, then ellipsis. "حساب الراجحي الجاري للمصاريف" should
              wrap rather than be cut after the first word. */}
          <Text variant="rowTitle" numberOfLines={2}>
            {title}
          </Text>
          <Text variant="metaSm" numberOfLines={1}>
            {category}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import type { Tone } from '@workspace/ui-native/lib/tone';
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
 * One asset, as a square in the vault grid.
 *
 * ## Bold fills, and a big glyph instead of a small disc
 *
 * Earlier versions used a 100-level tint carrying a 40px disc with a 19px icon
 * inside it. At that weight a tile is a pale rectangle with a speck in the
 * corner: the type is unreadable at a glance, the grid has no rhythm, and the
 * screen reads as unfinished however the rest is arranged.
 *
 * The fill is a **200-level tone** — clearly separated from the page and from
 * the other two tones — and the icon is drawn **32px directly on it** in the
 * tone's 700 step. No disc. What made the tile feel empty was a small mark in
 * a large space, and putting a container around that mark makes it smaller.
 *
 * ## Square, deliberately
 *
 * A tile sized by its content is as tall as its title, so a grid of mixed names
 * has a ragged edge and every tile looks like a different kind of thing. A
 * square is a decision: room for the glyph, a fixed place for the title, and a
 * rhythm the eye can sweep. An earlier attempt set a min-height while keeping
 * the pale styling and only made the emptiness taller — the shape was never the
 * problem, the weight was.
 *
 * ## Motion
 *
 * Tiles rise in staggered by position and spring under a finger. The entrance
 * honours reduced-motion; the press spring does not, because it is feedback
 * rather than decoration and its absence reads as an unresponsive control.
 *
 * ## Animated wrappers carry no className
 *
 * Uniwind styles components it has been taught about and `Animated.View` is not
 * one — a className on it is silently dropped, leaving an uncoloured shape with
 * no error. Every animated wrapper here carries only `style`; colour sits on
 * plain `View`s inside.
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

/**
 * Fill and glyph per tone, at a weight you can actually see.
 *
 * `sand` sits at 300 rather than 200: the 200 step is within a few percent of
 * the page, so notes and bank entries would read as holes in the grid rather
 * than as things in it.
 */
const SKIN: Record<Tone, { fill: string; glyph: string }> = {
  terracotta: { fill: 'bg-terracotta-200', glyph: 'text-terracotta-700' },
  olive: { fill: 'bg-olive-200', glyph: 'text-olive-700' },
  sand: { fill: 'bg-sand-300', glyph: 'text-sand-800' },
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
  const skin = SKIN[tone];

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.04 }],
  }));

  return (
    <Animated.View
      // 45ms apart: fast enough that a full grid settles before a thumb can
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
        className={cn(
          'rounded-card aspect-square justify-between p-4 shadow-sm',
          skin.fill
        )}
      >
        <Icon as={icon} size={32} strokeWidth={2.5} className={skin.glyph} />

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

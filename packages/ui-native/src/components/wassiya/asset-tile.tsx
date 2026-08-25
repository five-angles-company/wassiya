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
 * ## Why it kept reading as flat
 *
 * Three separate causes, fixed together — see `SKIN` for the colour half:
 *
 *  1. The fill was **darker than the page**, so the tile sank into it. A card
 *     has to be lighter than its ground before a shadow can mean anything.
 *  2. `shadow-sm` is 1px at 14%, which is invisible on a warm ground. The grid
 *     looked printed on the page rather than laid out over it.
 *  3. Glyph and fill were one hue at two brightnesses. Muddy by construction.
 *
 * ## Square, deliberately
 *
 * A tile sized by its content is as tall as its title, so a grid of mixed names
 * has a ragged edge and every tile looks like a different kind of thing. A
 * square is a decision: room for the chip, a fixed place for the title, and a
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
 * A card that **lifts off the page**, and a saturated chip on it.
 *
 * The previous fills sat at 200/300 — `sand-300` (#dcd3c4) is *darker* than the
 * #f5ead8 ground, so the tile read as a hole punched in the page rather than an
 * object resting on it. Every fill here is lighter than the ground, which is
 * what makes a shadow mean anything: light surface, dark edge, air underneath.
 *
 * The glyph moves back into a **solid** chip, but a real one — 44px carrying a
 * 22px icon in the tone's foreground, not a 40px wash carrying a tinted speck.
 * A saturated mark against a near-white card is the contrast the tile never had;
 * sand-800 on sand-300 was one hue at two brightnesses, which is the definition
 * of muddy.
 */
const SKIN: Record<Tone, { card: string; chip: string; onChip: string }> = {
  terracotta: {
    card: 'bg-terracotta-100',
    chip: 'bg-primary',
    onChip: 'text-primary-foreground',
  },
  olive: {
    card: 'bg-olive-100',
    chip: 'bg-secondary',
    onChip: 'text-secondary-foreground',
  },
  sand: { card: 'bg-sand-100', chip: 'bg-sand-600', onChip: 'text-sand-100' },
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
        // `shadow-md`, not `sm`. The small step is 1px at 14% — invisible against
        // a warm ground, which is why the grid looked printed on rather than
        // laid out.
        className={cn(
          'rounded-card aspect-square justify-between p-4 shadow-md',
          skin.card
        )}
      >
        <View
          className={cn(
            'size-11 items-center justify-center rounded-full',
            skin.chip
          )}
        >
          <Icon as={icon} size={22} strokeWidth={2.75} className={skin.onChip} />
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

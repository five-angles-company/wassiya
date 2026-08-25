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
 * One asset, as a two-zone card: a tinted cover over a label.
 *
 * ## Why it stopped being an app icon
 *
 * Every earlier version was the same shape — a small mark in a corner with text
 * under it — and restyling that shape (paler, bolder, shadowed, squared) never
 * fixed it, because the shape was the problem. A chip in the corner of a card
 * is the grammar of an *app launcher*: it says "tap to open a tool". A vault
 * holds objects, and an object wants a face.
 *
 * So the colour stops being a 44px chip and becomes a **cover** — a tinted
 * field across the top of the card with the glyph centred in it, the label
 * sitting below on near-white. That is the grammar of a card in a wallet, a
 * book on a shelf, a file in a drawer: a face, then a name.
 *
 * ## The second line says something now
 *
 * It used to repeat the category — "حسابات رقمية" under a glyph that already
 * means digital account. The tile spent its only supporting line restating its
 * own icon. It carries the asset's **subtitle** instead: the address, the
 * exchange, the last digits. The category is the fallback, for assets that have
 * no subtitle to give.
 *
 * ## Fixed zones, so the grid has an edge
 *
 * Cover and label are both fixed heights rather than content-sized. A tile as
 * tall as its title gives a grid of mixed names a ragged bottom edge and makes
 * every tile look like a different kind of thing; two fixed bands make a set.
 * Titles get two lines inside their band, which is what a vault owes a name
 * like "حساب الراجحي الجاري" — truncating at the first word would be worse
 * than any layout problem it solves.
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
  /**
   * The asset's own second line — an address, an exchange, a masked tail.
   * Callers pass the category only when the asset has no subtitle.
   */
  meta: string;
  /** From `ASSET_TYPE_TONE` — what the asset holds. */
  tone?: Tone;
  /** Position in its group, for the entrance stagger. */
  index?: number;
  onPress?: () => void;
  className?: string;
};

/**
 * The cover, and the glyph on it.
 *
 * 200-level covers sit clearly above the #f5ead8 page while staying quiet
 * enough to carry a name underneath. `sand` takes 300: its 200 step is within a
 * few percent of the ground, and a cover that matches the page is not a cover.
 */
const SKIN: Record<Tone, { cover: string; glyph: string }> = {
  terracotta: { cover: 'bg-terracotta-200', glyph: 'text-terracotta-700' },
  olive: { cover: 'bg-olive-200', glyph: 'text-olive-700' },
  sand: { cover: 'bg-sand-300', glyph: 'text-sand-800' },
};

export function AssetTile({
  icon,
  title,
  meta,
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
        // The card is lighter than the page, which is what lets a shadow read
        // as air underneath rather than dirt on top. `overflow-hidden` is what
        // makes the cover meet the rounded corner instead of squaring it off.
        className="rounded-card bg-sand-100 overflow-hidden shadow-md"
      >
        <View className={cn('h-24 items-center justify-center', skin.cover)}>
          <Icon as={icon} size={34} strokeWidth={2.5} className={skin.glyph} />
        </View>

        <View className="h-20 justify-center gap-0.5 px-3.5">
          <Text variant="rowTitle" numberOfLines={2}>
            {title}
          </Text>
          <Text variant="metaSm" numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

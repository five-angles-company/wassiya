import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { TONE_DISC_BG, TONE_DISC_FG, type Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * One asset, as a card in the vault grid.
 *
 * ## Why a grid and not a row
 *
 * A list row gave each asset a full-width card holding a small icon and two
 * short strings — mostly empty space, and three of them filled a screen. Assets
 * are *things*, and a grid of things is both denser and easier to sweep than a
 * column of near-empty bars. It also matches the tile language Home uses, so
 * the two tab roots read as one app.
 *
 * ## The tint means "what this holds", not "this needs attention"
 *
 * `ASSET_TYPE_TONE` groups the six types by content: terracotta for the ones
 * carrying a secret (seed phrases, passwords), olive for encrypted files, sand
 * for instructions. That is deliberately **not** the meaning terracotta has on
 * a `StatusPill`, where it means "act on this".
 *
 * The two never collide here because they are drawn in different places: the
 * type tint is on the tile's icon disc, and the destination signal — the thing
 * that actually needs attention — is the group heading above the grid. Tinting
 * the tile itself by destination would put both meanings on one surface and
 * make neither readable.
 */
export type AssetTileProps = {
  icon: LucideIcon;
  /** The decrypted name. */
  title: string;
  /** What kind of thing it is: "مستند", "عملة رقمية". */
  category: string;
  /** From `ASSET_TYPE_TONE` — what the asset holds. */
  tone?: Tone;
  onPress?: () => void;
  className?: string;
};

export function AssetTile({
  icon,
  title,
  category,
  tone = 'sand',
  onPress,
  className,
}: AssetTileProps) {
  return (
    <Pressable
      accessibilityRole={onPress === undefined ? undefined : 'button'}
      onPress={onPress}
      // `basis-[47%]` with **no `grow`**. Home's stat tiles grow because there
      // are always six of them; a destination group can hold one, and a lone
      // growing tile stretches to full width and stops reading as a tile at
      // all — it becomes a row, in a grid, next to nothing.
      className={cn(
        'rounded-card bg-card basis-[47%] gap-3 p-4',
        onPress !== undefined && 'active:bg-sand-300',
        className
      )}
    >
      <View
        className={cn(
          'size-10 items-center justify-center rounded-full',
          TONE_DISC_BG[tone]
        )}
      >
        <Icon as={icon} size={19} strokeWidth={2.75} className={TONE_DISC_FG[tone]} />
      </View>

      <View className="gap-0.5">
        {/* Two lines, then ellipsis. An asset called "حساب الراجحي الجاري
            للمصاريف" should wrap rather than be cut at the first word. */}
        <Text variant="rowTitle" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="metaSm" numberOfLines={1}>
          {category}
        </Text>
      </View>
    </Pressable>
  );
}

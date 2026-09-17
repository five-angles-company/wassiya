import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import {
  StatusPill,
  type StatusPillStatus,
} from '@workspace/ui-native/components/wassiya/status-pill';
import type { Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * One asset, as a row.
 *
 * The leading mark is a cover, not an icon: a 52px tinted square carrying the
 * glyph in that tone's dark step. The old 36px disc of the page's own colour
 * made every row identical at a glance; this gives a list of mixed assets colour
 * and rhythm down its leading edge, which is what makes a long vault scannable.
 *
 * `bg-sand-100` is lighter than the #f5ead8 ground, and that ordering matters
 * more than any shadow value — a surface darker than its background reads as a
 * hole punched in the page, and no amount of blur fixes it.
 *
 * The trailing slot earns its place or yields. A row shows its recipient state
 * only when the caller passes one: in a list already grouped by destination every
 * row in a group shares an answer, so repeating it per row is noise. No status
 * means a chevron, which at least says "this opens".
 */
export type AssetRowProps = {
  icon: LucideIcon;
  /** Decrypted title. */
  title: string;
  /** Address, chain, masked IBAN, file size — whatever identifies it at a glance. */
  meta?: string;
  /** From `ASSET_TYPE_TONE` — what the asset holds. Colours the leading mark. */
  tone?: Tone;
  /** Recipient state. `action` = "بلا مستلم", the one thing a user must fix. */
  recipientStatus?: StatusPillStatus;
  recipientLabel?: string;
  onPress?: () => void;
  className?: string;
};

/** Cover fill and glyph per tone. `sand` takes 300; its 200 matches the page. */
const SKIN: Record<Tone, { cover: string; glyph: string }> = {
  terracotta: { cover: 'bg-terracotta-200', glyph: 'text-terracotta-700' },
  olive: { cover: 'bg-olive-200', glyph: 'text-olive-700' },
  sand: { cover: 'bg-sand-300', glyph: 'text-sand-800' },
};

export function AssetRow({
  icon,
  title,
  meta,
  tone = 'sand',
  recipientStatus,
  recipientLabel,
  onPress,
  className,
}: AssetRowProps) {
  const pressed = useSharedValue(0);
  const skin = SKIN[tone];

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.02 }],
  }));

  const body = (
    <>
      <View
        className={cn(
          'rounded-box size-12 shrink-0 items-center justify-center',
          skin.cover
        )}
      >
        <Icon as={icon} size={22} strokeWidth={2.5} className={skin.glyph} />
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="rowTitle" numberOfLines={1}>
          {title}
        </Text>
        {meta !== undefined ? (
          <Text variant="metaSm" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>

      {recipientStatus !== undefined ? (
        <StatusPill status={recipientStatus}>{recipientLabel}</StatusPill>
      ) : onPress !== undefined ? (
        /*
          Authored as the LTR-forward glyph and mirrored by `flip`, which is the
          only combination that survives both directions. `ChevronLeft` + `flip`
          renders *right*-pointing under RTL — sitting at the trailing edge
          aiming back into the row it belongs to.
        */
        <Icon
          as={ChevronRight}
          size={17}
          strokeWidth={2.5}
          className="text-sand-500 shrink-0"
          flip
        />
      ) : null}
    </>
  );

  const shell = cn(
    // `shadow-sm`, deliberately. Twelve rows each carrying a 10px blur reads
    // as smudge rather than depth; what lifts a row is being lighter than the
    // page, and the shadow only has to hint at the edge.
        // 48px mark + 12px padding = a 72px row. At 52/14 it stood 90px tall for
    // two short lines of text, which is what made the trailing chevron look
    // marooned: the emptier a row is, the more space it has to be empty in.
    'rounded-row bg-sand-100 flex-row items-center gap-3 p-3 shadow-sm',
    className
  );

  // A row with no handler is a record, not a control — `AssetRow` is used that
  // way on the heir preview, where nothing is tappable.
  if (onPress === undefined) return <View className={shell}>{body}</View>;

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withSpring(1, { damping: 18, stiffness: 260 });
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, { damping: 18, stiffness: 260 });
        }}
        className={shell}
      >
        {body}
      </Pressable>
    </Animated.View>
  );
}

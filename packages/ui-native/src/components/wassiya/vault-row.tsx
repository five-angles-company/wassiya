import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { AvatarStack } from '@workspace/ui-native/components/wassiya/avatar-stack';
import { TONE_DISC_BG, TONE_DISC_FG } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * One asset in the vault list — a full-width `StatTile`.
 *
 * ## Why this is a card again
 *
 * A card per asset was tried and rejected once. What was rejected was an
 * *invented* card; this is the surface Home already uses and the owner already
 * approved — `rounded-card bg-card px-4 py-3.5`, a 36px round tone disc, a name
 * over a quiet second line. Home is a 2-up grid of those and the vault is a
 * single column of them, which is the whole of what makes the two screens read
 * as one app.
 *
 * The consequence is that there are **no hairlines**. Cards separate themselves;
 * a rule between two card edges is a third thing doing a job neither needs.
 *
 * ## The disc's colour is routing, never type
 *
 * `ASSET_TYPE_TONE` exists and is the obvious thing to reach for, and it is the
 * wrong one: its own doc says terracotta there means *"this one contains a
 * secret"*, not *"this one needs attention"* — the opposite of what the same
 * colour means on Home. Colouring by type would put a legend on the screen and
 * break the one thing worth keeping consistent.
 *
 * So the disc says what Home's discs say: **terracotta when it reaches nobody**,
 * sand otherwise. One colour, one meaning, both screens.
 */
export type VaultRowProps = {
  icon: LucideIcon;
  /** The decrypted asset name. */
  title: string;
  /** Recipient names, already joined — "سارة، عمر". */
  recipients: string;
  /** Shown in terracotta instead of `recipients` when nothing is routed. */
  unroutedLabel?: string;
  /** Drives the faces. Empty renders the dashed ring. */
  faces?: string[];
  /** The shared bucket's word — "الكل" — in place of an initial. */
  allHeirsLabel?: string;
  onPress?: () => void;
  className?: string;
};

export function VaultRow({
  icon,
  title,
  recipients,
  unroutedLabel,
  faces = [],
  allHeirsLabel,
  onPress,
  className,
}: VaultRowProps) {
  const unrouted = unroutedLabel !== undefined;
  const tone = unrouted ? 'terracotta' : 'sand';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn(
        'rounded-card bg-card flex-row items-center gap-3 px-4 py-3.5',
        onPress && 'active:bg-sand-300',
        className
      )}>
      <View
        className={cn(
          'size-9 shrink-0 items-center justify-center rounded-full',
          TONE_DISC_BG[tone]
        )}>
        <Icon as={icon} size={18} strokeWidth={2.75} className={TONE_DISC_FG[tone]} />
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="rowTitle" numberOfLines={1}>
          {title}
        </Text>
        <Text
          variant="metaSm"
          numberOfLines={1}
          className={unrouted ? 'text-terracotta-800 font-body-semibold' : undefined}>
          {unrouted ? unroutedLabel : recipients}
        </Text>
      </View>

      {/* `ring="surface"`: the faces are cut out of the card now, not the page,
          and the wrong ground leaves a hairline of the wrong colour on each. */}
      <AvatarStack
        names={unrouted ? [] : faces}
        allHeirsLabel={unrouted ? undefined : allHeirsLabel}
        size={29}
        ring="surface"
      />
    </Pressable>
  );
}

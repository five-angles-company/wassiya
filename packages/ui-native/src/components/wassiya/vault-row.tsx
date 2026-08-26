import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { AvatarStack } from '@workspace/ui-native/components/wassiya/avatar-stack';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * One asset in the vault list.
 *
 * ## What this row deliberately does not have
 *
 * No chevron, no badge column, no type heading, no filter chip, no card, no
 * shadow. The board cut all of it: *"a vault is a place you visit rarely and
 * calmly — it should be almost empty."* What is left is a name, who receives
 * it, and a small tile carrying the type in one neutral colour.
 *
 * The type tile is 42px, `--color-surface`, and its glyph is terracotta-800 for
 * **every** type. Colour-coding types would make the list a legend to learn;
 * the shape of the icon already says enough, and keeping one colour is what
 * lets the single terracotta line below a name mean something.
 *
 * ## Unrouted reads without a badge
 *
 * An asset that reaches nobody says so in terracotta where its recipients would
 * be, and ends in a dashed ring where their faces would be. Two changes in the
 * same two slots — no extra element, nothing to learn, and the gap is legible
 * at a glance down the list.
 *
 * ## The hairline is inset to the text
 *
 * 56px — the tile plus the gap — so the rules line up under the names and the
 * tiles read as a column rather than as boxes in a table.
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
  divider?: boolean;
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
  divider,
  onPress,
  className,
}: VaultRowProps) {
  const unrouted = unroutedLabel !== undefined;

  return (
    <View className={className}>
      <Pressable
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        className="flex-row items-center gap-[14px] py-[13px] active:opacity-70">
        <View className="bg-card size-[42px] shrink-0 items-center justify-center rounded-[14px]">
          <Icon as={icon} size={20} strokeWidth={2.75} className="text-terracotta-800" />
        </View>

        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className="font-body-semibold text-foreground text-[15.5px] leading-[1.35]">
            {title}
          </Text>
          <Text
            numberOfLines={1}
            className={cn(
              'mt-0.5 text-[11.5px]',
              unrouted ? 'text-terracotta-800 font-body-semibold' : 'opacity-50'
            )}>
            {unrouted ? unroutedLabel : recipients}
          </Text>
        </View>

        <AvatarStack
          names={unrouted ? [] : faces}
          allHeirsLabel={unrouted ? undefined : allHeirsLabel}
          size={29}
          ring="bg"
        />
      </Pressable>
      {divider ? <View className="bg-border ms-[56px] h-px" /> : null}
    </View>
  );
}

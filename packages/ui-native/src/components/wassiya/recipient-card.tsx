import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { AvatarStack } from '@workspace/ui-native/components/wassiya/avatar-stack';
import { cn } from '@workspace/ui-native/lib/utils';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * Who receives this asset — the one card on the asset screen.
 *
 * Everything else on that screen is a hairline row. This is a surface because
 * it is *"the one thing that leaves this device"*: the fields are the owner's
 * own record, and this is the instruction that outlives them. One enclosed
 * element on a page of rules reads as important without any label saying so.
 *
 * ## Unrouted turns the card terracotta
 *
 * When nothing is routed the card is the only tinted thing on the screen and
 * reads "لا أحد بعد" against a dashed ring — the same gap, in the same shape,
 * that the vault list shows for the same asset. An owner who learns it in one
 * place has learned it in both.
 */
export type RecipientCardProps = {
  /** "يستلمها". */
  label: string;
  /** Joined names, or the nobody-yet copy when `unrouted`. */
  value: string;
  faces?: string[];
  allHeirsLabel?: string;
  /** Tints the card and opens the dashed ring. */
  unrouted?: boolean;
  onPress?: () => void;
  className?: string;
};

export function RecipientCard({
  label,
  value,
  faces = [],
  allHeirsLabel,
  unrouted = false,
  onPress,
  className,
}: RecipientCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      className={cn(
        'flex-row items-center gap-[13px] rounded-[24px] px-[17px] py-[15px]',
        unrouted ? 'bg-terracotta-100' : 'bg-card',
        onPress && 'active:opacity-80',
        className
      )}>
      <View className="min-w-0 flex-1">
        <Text
          className={cn(
            'mb-[5px] text-[12px]',
            unrouted ? 'text-terracotta-900 opacity-75' : 'opacity-50'
          )}>
          {label}
        </Text>
        <Text
          numberOfLines={2}
          className={cn(
            'text-[14.5px]',
            unrouted
              ? 'font-body-bold text-terracotta-900'
              : 'font-body-semibold text-foreground'
          )}>
          {value}
        </Text>
      </View>

      <AvatarStack
        names={unrouted ? [] : faces}
        allHeirsLabel={unrouted ? undefined : allHeirsLabel}
        size={32}
        ring="surface"
      />

      {/* Forward, so it mirrors: in Arabic this points left. */}
      <Icon
        as={ChevronRight}
        flip
        size={17}
        strokeWidth={2.75}
        className={cn('shrink-0', unrouted ? 'text-terracotta-900' : 'opacity-40')}
      />
    </Pressable>
  );
}

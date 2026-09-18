import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { Pressable, View } from 'react-native';

/**
 * One option in a list where the choice deserves a sentence.
 *
 * Chips are for options short enough to read at a glance — a network, an
 * account type. This is for the ones that need a second line to be understood,
 * and ٤.٧'s disposition is the reason it exists: "سلّمه إلى وارث" and "احذف
 * الحساب نهائياً" are not two settings, they are two very different
 * instructions to a grieving person, and each earns its explanation.
 *
 * ## Nothing is pre-selected
 *
 * A default here would quietly decide something people
 * feel strongly about, and "delete" chosen by accident cannot be undone. So the
 * caller passes `null` until someone chooses, and the screen's button stays
 * surface-toned and says why.
 */
export type RadioRowProps = {
  title: string;
  /** What choosing this actually does. */
  detail?: string;
  selected: boolean;
  onPress: () => void;
  divider?: boolean;
  className?: string;
};

export function RadioRow({
  title,
  detail,
  selected,
  onPress,
  divider,
  className,
}: RadioRowProps) {
  return (
    <View className={className}>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={title}
        className="flex-row items-center gap-[13px] py-3.5 active:opacity-70">
        <View
          className={cn(
            'size-[22px] shrink-0 items-center justify-center rounded-full',
            selected ? 'bg-primary' : 'border-sand-400 border-[2.25px]'
          )}>
          {/* The design system draws the checked dot as an inset ring, which
              RN has no equivalent for — an inner disc in the ground colour is
              the same mark by other means. */}
          {selected ? <View className="bg-background size-2 rounded-full" /> : null}
        </View>

        <View className="min-w-0 flex-1">
          <Text className="font-body-semibold text-foreground text-[15px]">
            {title}
          </Text>
          {detail !== undefined ? (
            <Text className="mt-0.5 text-[11.5px] leading-[1.5] opacity-50">
              {detail}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {divider ? <View className="bg-border h-px" /> : null}
    </View>
  );
}

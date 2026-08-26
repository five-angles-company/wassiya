import { Text } from '@workspace/ui-native/components/ui/text';
import { Pressable } from 'react-native';

/**
 * The text form of {@link ScreenTop}'s trailing slot — "إلغاء" while a field is
 * being edited.
 *
 * It occupies the same position the overflow menu does at rest, so the two ways
 * out of the asset screen are always in the same two places. Text rather than
 * an icon because cancelling an edit is a decision, and a glyph would make it
 * guessable rather than readable.
 */
export type ScreenTopActionProps = {
  label: string;
  onPress: () => void;
};

export function ScreenTopAction({ label, onPress }: ScreenTopActionProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}>
      <Text className="text-terracotta-800 font-body-semibold shrink-0 text-[12.5px]">
        {label}
      </Text>
    </Pressable>
  );
}

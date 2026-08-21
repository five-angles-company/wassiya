import { Text } from '@workspace/ui-native/components/ui/text';
import { monoFont } from '@workspace/ui-native/lib/fonts';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

/** Deterministic pill widths, so the mask looks like words and not a bar. */
const WIDTHS = ['w-13', 'w-9.5', 'w-15', 'w-11', 'w-8.5', 'w-14', 'w-10', 'w-12'] as const;

export type SecretWordPillsProps = {
  /** Number of masked pills to draw. */
  count: number;
  /** The real words, shown only while revealed. */
  words?: string[];
  revealed?: boolean;
  className?: string;
};

/**
 * The masked representation of a seed phrase.
 *
 * Words render as grey pills of varying width so the holder can verify the
 * *length* of the phrase — "is it 12 or 24?" — without any of it being on
 * screen or in an accessibility tree. Widths come from a fixed cycle rather
 * than a random draw: a mask that reshuffles on every render looks like the
 * value changed.
 */
export function SecretWordPills({ count, words, revealed, className }: SecretWordPillsProps) {
  if (revealed && words?.length) {
    return (
      <View className={cn('flex-row flex-wrap gap-2', className)} style={{ direction: 'ltr' }}>
        {words.map((word, index) => (
          <View key={`${word}-${index}`} className="bg-sand-200 rounded-full px-2.5 py-1">
            <Text className={cn(monoFont, 'text-meta')}>{`${index + 1}. ${word}`}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    // Hidden from the accessibility tree as well as the screen: a screen
    // reader announcing "12 grey pills" is noise, and the mask must not become
    // a side channel if real words are ever passed while `revealed` is false.
    <View
      className={cn('flex-row flex-wrap gap-1.75', className)}
      importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          className={cn('bg-sand-300 h-2.75 rounded-full', WIDTHS[index % WIDTHS.length])}
        />
      ))}
    </View>
  );
}

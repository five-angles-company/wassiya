import { Text } from '@workspace/ui-native/components/ui/text';
import { monoFont } from '@workspace/ui-native/lib/fonts';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

/**
 * A recovery phrase, as numbered pills — the one enclosed thing on ٤.٣.
 *
 * Everything else on that screen is a label-over-value row on a hairline. This
 * sits inside a 24px surface, and the contrast is the point: it reads as the
 * vault-within-the-vault, the thing the whole screen exists to hold.
 *
 * ## The index is not decoration
 *
 * An heir reads a phrase back **in order**, one word at a time, into a wallet
 * that will reject the lot if any position is wrong. A grid without numbers
 * makes them count pills; a grid with them makes the twelfth word findable.
 *
 * ## Words are LTR mono inside an RTL grid
 *
 * The pills flow right-to-left with the layout — pill ١ sits top-right — while
 * each word inside its pill stays left-to-right and fixed-width. Both are true
 * at once and both matter: the reading order is Arabic, the words are not.
 */
export type SeedGridProps = {
  /** In order. An empty array renders nothing rather than an empty box. */
  words: string[];
  /** Numerals for the index, so ١ / 1 follows the locale. */
  formatIndex?: (n: number) => string;
  className?: string;
};

export function SeedGrid({ words, formatIndex, className }: SeedGridProps) {
  if (words.length === 0) return null;
  return (
    <View
      className={cn(
        'rounded-[24px] bg-card flex-row flex-wrap gap-[7px] p-[15px]',
        className
      )}>
      {words.map((word, i) => (
        <View
          key={`${word}-${i}`}
          className="bg-background flex-row items-center gap-1.5 rounded-full px-3 py-2">
          <Text className={cn(monoFont, 'text-[9.5px] leading-[1] opacity-40')}>
            {formatIndex ? formatIndex(i + 1) : String(i + 1)}
          </Text>
          <Text className={cn(monoFont, 'text-foreground text-[12.5px] leading-[1]')}>
            {word}
          </Text>
        </View>
      ))}
    </View>
  );
}

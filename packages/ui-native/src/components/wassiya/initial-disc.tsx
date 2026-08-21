import { Text } from '@workspace/ui-native/components/ui/text';
import { TONE_DISC_BG, TONE_DISC_FG, type Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

/** Disc diameters from the board: 30px stacked, 38px inline, 44px card avatar. */
const SIZES = {
  sm: { box: 'size-7.5', text: 'text-meta' },
  md: { box: 'size-9.5', text: 'text-row' },
  lg: { box: 'size-11', text: 'text-title' },
} as const;

export type InitialDiscSize = keyof typeof SIZES;

export type InitialDiscProps = {
  /** Full name; the first character becomes the glyph. */
  name: string;
  /** Semantic tone — olive for confirmed heirs, sand for pending, etc. */
  tone?: Tone;
  size?: InitialDiscSize;
  className?: string;
};

/**
 * The round monogram used wherever a person appears without a photo — heir
 * cards, recipient rows, the home greeting, stacked recipient clusters.
 *
 * Takes the first *grapheme* rather than `name[0]`: an Arabic name may begin
 * with a combining sequence, and slicing mid-sequence renders a stray mark.
 */
export function InitialDisc({ name, tone = 'sand', size = 'md', className }: InitialDiscProps) {
  const glyph = [...name.trim()][0] ?? '';
  const dims = SIZES[size];
  return (
    <View
      className={cn(
        'shrink-0 items-center justify-center rounded-full',
        dims.box,
        TONE_DISC_BG[tone],
        className
      )}>
      <Text className={cn('font-body-bold', dims.text, TONE_DISC_FG[tone])}>{glyph}</Text>
    </View>
  );
}

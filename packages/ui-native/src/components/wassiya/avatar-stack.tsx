import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

/**
 * Who receives this — as faces, at the end of a row. This product carries status
 * with faces and one line of text: no badges, no bars, no scores. In an
 * inheritance vault the only status worth showing is *who gets this*, and a name
 * answers it better than any pill. The discs overlap by 9px, so four recipients
 * cost the same width as two.
 *
 * The empty state is a dashed ring rather than a missing element, so the gap is
 * visible in the same place the answer would be — which is what lets the list
 * say "this reaches no one" without a badge system.
 *
 * **The ring colour is a prop** because each disc is cut out of whatever is
 * behind it with a 2px border in the *ground* colour: the page on the vault
 * list, the card inside the recipient card. Getting it wrong leaves a hairline
 * of the wrong colour around every face.
 */
export type AvatarStackProps = {
  /** Display names. Only the first letter of each is drawn. */
  names: string[];
  /** Disc diameter — 29 in a list row, 32 in the recipient card. */
  size?: number;
  /** The colour behind the stack, so the cut-out reads cleanly. */
  ring?: 'bg' | 'surface';
  /**
   * The shared bucket. A group is not a person, so it carries the word "الكل"
   * rather than an initial — a letter would make a category look like someone.
   */
  allHeirsLabel?: string;
  className?: string;
};

/** Alternating olive steps, so adjacent faces stay distinguishable. */
const FILL = ['bg-olive-200', 'bg-olive-300', 'bg-olive-200', 'bg-olive-300'];

export function AvatarStack({
  names,
  size = 29,
  ring = 'bg',
  allHeirsLabel,
  className,
}: AvatarStackProps) {
  const border = ring === 'bg' ? 'border-background' : 'border-card';

  if (allHeirsLabel !== undefined) {
    return (
      <View
        className={cn('bg-olive-200 shrink-0 items-center justify-center rounded-full', className)}
        style={{ width: size, height: size }}>
        <Text className="font-body-bold text-olive-900 text-[10px]">{allHeirsLabel}</Text>
      </View>
    );
  }

  if (names.length === 0) {
    return (
      <View
        className={cn('border-primary shrink-0 rounded-full border-[2.25px] border-dashed', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <View className={cn('shrink-0 flex-row', className)}>
      {names.map((name, i) => (
        <View
          key={`${name}-${i}`}
          className={cn(
            'items-center justify-center rounded-full',
            FILL[i % FILL.length],
            i > 0 && cn('-ms-[9px] border-2', border)
          )}
          style={{ width: size, height: size }}>
          <Text
            className="font-body-bold text-olive-900"
            style={{ fontSize: Math.round(size * 0.4 * 10) / 10 }}>
            {[...name.trim()][0] ?? '?'}
          </Text>
        </View>
      ))}
    </View>
  );
}

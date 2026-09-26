import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

/**
 * People as faces, at the end of a row — status carried by faces and one line
 * of text, never badges. The discs overlap by 9px, so four people cost the same
 * width as two. The empty state is a dashed ring, so the gap shows where the
 * answer would be.
 *
 * **The ring colour is a prop** because each disc is cut out of whatever is
 * behind it with a 2px border in the *ground* colour. Getting it wrong leaves a
 * hairline of the wrong colour around every face.
 */
export type AvatarStackProps = {
  /** Display names. Only the first letter of each is drawn. */
  names: string[];
  /** Disc diameter. */
  size?: number;
  /** The colour behind the stack, so the cut-out reads cleanly. */
  ring?: 'bg' | 'surface';
  className?: string;
};

/** Alternating olive steps, so adjacent faces stay distinguishable. */
const FILL = ['bg-olive-200', 'bg-olive-300', 'bg-olive-200', 'bg-olive-300'];

export function AvatarStack({
  names,
  size = 29,
  ring = 'bg',
  className,
}: AvatarStackProps) {
  const border = ring === 'bg' ? 'border-background' : 'border-card';

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

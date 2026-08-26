import {
  AssetTypeTile,
  type AssetTypeTileProps,
} from '@workspace/ui-native/components/wassiya/asset-type-tile';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

export type AssetTypeOption = AssetTypeTileProps & { id: string };

export type AssetTypeGridProps = {
  /** The asset types on offer — six, on the board. */
  options: AssetTypeOption[];
  className?: string;
};

/**
 * The "what do you want to keep safe?" picker.
 *
 * Two columns of tiles, one per asset type, each opening its own wizard —
 * every type asks for different things, and the point of splitting them is to
 * ask only for what an heir will actually need.
 *
 * Laid out as explicit rows of two rather than `flex-wrap`, so tiles in a row
 * stretch to equal height. Wrapping would leave a short tile next to a tall
 * one whenever one description runs to two lines.
 */
export function AssetTypeGrid({ options, className }: AssetTypeGridProps) {
  const rows: AssetTypeOption[][] = [];
  for (let i = 0; i < options.length; i += 2) rows.push(options.slice(i, i + 2));

  return (
    <View className={cn('gap-row', className)}>
      {rows.map((row) => (
        <View key={row.map((o) => o.id).join('-')} className="gap-row flex-row items-stretch">
          {row.map(({ id, ...tile }) => (
            <AssetTypeTile key={id} {...tile} />
          ))}
          {/* Keep a lone last tile at half width instead of stretching it. */}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}

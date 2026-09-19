import { Skeleton } from '@workspace/ui-native/components/ui/skeleton';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

export type AssetRowSkeletonProps = {
  /** How many placeholder rows to draw. */
  count?: number;
  className?: string;
};

/**
 * Loading placeholder for {@link AssetRow}.
 *
 * Matches the real row's geometry exactly — 40px disc, two text lines, a
 * trailing pill — so the list does not reflow when the decrypted titles
 * arrive. Asset rows decrypt per row, so this state is genuinely visible on a
 * cold open, not a theoretical one.
 */
export function AssetRowSkeleton({ count = 3, className }: AssetRowSkeletonProps) {
  return (
    <View className={cn('gap-row', className)}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          className="bg-card border border-border flex-row items-center gap-3 rounded-row px-4 py-3.5">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <View className="flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-2/5 rounded-full" />
            <Skeleton className="h-2.5 w-3/5 rounded-full" />
          </View>
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
        </View>
      ))}
    </View>
  );
}

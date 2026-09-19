import { Text } from '@workspace/ui-native/components/ui/text';
import { MeterBar, type MeterSegment } from '@workspace/ui-native/components/wassiya/meter-bar';
import { fmtNum } from '@workspace/ui-native/lib/format';
import {
  resolveLabels,
  type LabelledProps,
  type LabelSet,
  type Locale,
} from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

type StorageLabelKey = 'title' | 'of' | 'unit' | 'empty';

const LABELS: LabelSet<StorageLabelKey> = {
  title: { ar: 'التخزين المشفّر', en: 'Encrypted storage' },
  of: { ar: 'من', en: 'of' },
  unit: { ar: 'غ.ب', en: 'GB' },
  empty: { ar: 'لم تُستخدم بعد', en: 'Nothing stored yet' },
};

/** Bytes per gigabyte, for the default size formatter. */
const BYTES_PER_GB = 1_000_000_000;

/**
 * Category fills, in order: photos terracotta, documents olive,
 * messages sand-500. Exported so a caller adding a fourth category can see
 * what it has to sit next to.
 */
export const STORAGE_SEGMENT_COLORS = ['bg-primary', 'bg-secondary', 'bg-sand-500'] as const;

export type StorageSegment = {
  /** Already-localised category name: "صور", "مستندات", "رسائل". */
  label: string;
  bytes: number;
  /** Fill class. Defaults to this segment's position in the order above. */
  color?: string;
};

export type StorageMeterProps = LabelledProps<StorageLabelKey> & {
  /** The plan's total allowance. Segments are shares of THIS, not of usage. */
  quotaBytes: number;
  segments: StorageSegment[];
  /**
   * Formats a byte count to a bare number — no unit, which is appended once by
   * the caller of this function. Overridable for plans priced in other units.
   *
   * A single formatter serves both the header and the legend on purpose: two
   * of them drift, and "١٠ غ.ب" in the header beside "١٠٫٠ غ.ب" in the legend
   * is the kind of thing nobody notices for a month.
   */
  formatSize?: (bytes: number, locale: Locale) => string;
  /** New account: draw the empty track and say so, rather than a 0% bar. */
  empty?: boolean;
  className?: string;
};

function defaultFormatSize(bytes: number, locale: Locale): string {
  return fmtNum(bytes / BYTES_PER_GB, locale, { maximumFractionDigits: 1 });
}

/**
 * The encrypted-storage card on the subscription screen (9.4).
 *
 * The bar is segmented by category and every segment is a share of the
 * **quota**, not of used space — a bar that renormalises to usage would show a
 * "full" photos segment on an almost-empty vault.
 *
 * The track is the page ground rather than a sand tint: this card sits on the
 * card surface, so the unused remainder has to read as darker than its
 * container to look like empty space instead of another category.
 */
export function StorageMeter({
  quotaBytes,
  segments,
  formatSize = defaultFormatSize,
  empty,
  locale = 'ar',
  labels,
  className,
}: StorageMeterProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const safeQuota = quotaBytes > 0 ? quotaBytes : 1;
  const used = segments.reduce((sum, s) => sum + s.bytes, 0);
  const isEmpty = empty || used <= 0;

  const bars: MeterSegment[] = segments.map((segment, index) => ({
    id: `${segment.label}-${index}`,
    tone: 'sand',
    color: segment.color ?? STORAGE_SEGMENT_COLORS[index % STORAGE_SEGMENT_COLORS.length],
    value: segment.bytes / safeQuota,
  }));

  return (
    <View className={cn('bg-card border border-border gap-row rounded-card p-4', className)}>
      <View className="flex-row items-baseline gap-2">
        <Text variant="sectionLabel" className="flex-1">
          {t.title}
        </Text>
        <Text className="text-meta opacity-70">
          {`${formatSize(used, locale)} ${t.of} ${formatSize(quotaBytes, locale)} ${t.unit}`}
        </Text>
      </View>

      <MeterBar segments={isEmpty ? [] : bars} tone="sand" className="bg-background" />

      {isEmpty ? (
        <Text variant="metaSm">{t.empty}</Text>
      ) : (
        <View className="flex-row flex-wrap gap-x-3 gap-y-1.5">
          {segments.map((segment, index) => (
            <View key={`${segment.label}-${index}`} className="flex-row items-center gap-1.5">
              <View
                className={cn(
                  'size-2.25 rounded-full',
                  segment.color ?? STORAGE_SEGMENT_COLORS[index % STORAGE_SEGMENT_COLORS.length]
                )}
              />
              <Text className="text-metasm opacity-75">
                {`${segment.label} ${formatSize(segment.bytes, locale)} ${t.unit}`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

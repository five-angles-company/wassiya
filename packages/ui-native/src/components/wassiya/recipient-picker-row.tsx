import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { InitialDisc } from '@workspace/ui-native/components/wassiya/initial-disc';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, ShieldCheck, Users } from 'lucide-react-native';
import type * as React from 'react';
import { Pressable, View } from 'react-native';

export type RecipientKind =
  /** A named heir — receives the asset whole, as their own key envelope. */
  | 'heir'
  /** The executor — receives handover instructions, never the payload. */
  | 'executor'
  /** The default bucket: everything unrouted goes to all heirs jointly. */
  | 'allHeirs';

type RecipientLabelKey = 'wholeAsset' | 'executorNote' | 'allHeirsNote';

const LABELS: LabelSet<RecipientLabelKey> = {
  wholeAsset: {
    ar: 'يستلم الأصل كاملاً — لا يمكن تجزئة عبارة سرّية أو مستند',
    en: 'Receives the whole asset — a phrase or a document cannot be split',
  },
  executorNote: {
    ar: 'يستلم التعليمات فقط، دون المفاتيح',
    en: 'Receives the instructions only, not the keys',
  },
  allHeirsNote: {
    ar: 'وصول مشترك لجميع الورثة',
    en: 'Joint access for all heirs',
  },
};

export type RecipientPickerRowProps = LabelledProps<RecipientLabelKey> & {
  kind?: RecipientKind;
  /** Person's name, or the bucket's name for `allHeirs`. */
  name: string;
  /** Relation line: "ابن · وارث مُبلَّغ". Defaults to the kind's own note. */
  detail?: string;
  selected: boolean;
  onToggle: () => void;
  /**
   * Extra footnote under the row. Use it for the whole-asset reminder on
   * screens where a user might still be looking for a percentage field.
   */
  footnote?: React.ReactNode;
  /** Show the built-in "receives the whole asset" footnote. */
  showWholeAssetNote?: boolean;
  className?: string;
};

/**
 * One selectable recipient when routing an asset.
 *
 * This is a **multi-select**, not a split: cryptographically each selected
 * recipient gets their own wrapped copy of the key, so the picker's output is
 * a list of key envelopes, never a ratio. There are no percentages anywhere in
 * this product — the law fixes the fara'id, and a seed phrase cannot be
 * divided regardless of what any UI might imply.
 *
 * The executor kind is a different capability, not a lesser share: handover
 * instructions without the payload, which is what an executor actually needs.
 */
export function RecipientPickerRow({
  kind = 'heir',
  name,
  detail,
  selected,
  onToggle,
  footnote,
  showWholeAssetNote,
  locale = 'ar',
  labels,
  className,
}: RecipientPickerRowProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const fallbackDetail =
    kind === 'executor' ? t.executorNote : kind === 'allHeirs' ? t.allHeirsNote : undefined;

  return (
    <View className={cn('gap-1.5', className)}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        className={cn(
          'flex-row items-center gap-3 rounded-row px-4 py-3.5',
          selected ? 'bg-olive-100' : 'bg-card'
        )}>
        {kind === 'heir' ? (
          <InitialDisc name={name} tone={selected ? 'olive' : 'sand'} />
        ) : (
          <View
            className={cn(
              'size-9.5 shrink-0 items-center justify-center rounded-full',
              selected ? 'bg-olive-200' : 'bg-background'
            )}>
            <Icon
              as={kind === 'executor' ? ShieldCheck : Users}
              className={cn('size-4.5', selected ? 'text-olive-900' : 'text-terracotta-700')}
            />
          </View>
        )}

        <View className="min-w-0 flex-1 gap-0.5">
          <Text variant="rowTitle" numberOfLines={1}>
            {name}
          </Text>
          {detail ?? fallbackDetail ? (
            <Text variant="metaSm" numberOfLines={1}>
              {detail ?? fallbackDetail}
            </Text>
          ) : null}
        </View>

        {selected ? (
          <View className="bg-secondary size-6.5 shrink-0 items-center justify-center rounded-full">
            <Icon as={Check} className="text-secondary-foreground size-3.75" strokeWidth={3} />
          </View>
        ) : (
          <View className="border-sand-400 size-6.5 shrink-0 rounded-full border-2" />
        )}
      </Pressable>

      {showWholeAssetNote ? (
        <Text variant="metaSm" className="ps-4">
          {t.wholeAsset}
        </Text>
      ) : null}
      {footnote}
    </View>
  );
}

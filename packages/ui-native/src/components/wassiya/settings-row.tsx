import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type * as React from 'react';
import { Pressable, View } from 'react-native';

export type SettingsRowProps = {
  /** Row label: "الفواتير والإيصالات", "ترقية الخطة". */
  label: string;
  /** Optional second line. */
  detail?: string;
  /** Leading glyph. Omit for a plain text row. */
  icon?: LucideIcon;
  /** Trailing text — a price, a current value, a count. */
  value?: string;
  /** Tint the trailing value as an action ("ترقية… ٢٩ ر.س"). */
  valueTone?: 'default' | 'action';
  /** Trailing control (a Switch) in place of the value + chevron. */
  accessory?: React.ReactNode;
  /** Recede the row — used for "إلغاء الاشتراك". */
  quiet?: boolean;
  /** Hide the chevron on rows that do not navigate. */
  chevron?: boolean;
  /** Draw the hairline rule under the row (omit on the last one). */
  divider?: boolean;
  onPress?: () => void;
  className?: string;
};

/**
 * A row in a settings list. Recurs throughout section ٩ — billing, plan,
 * security, legal — so it lives here rather than in any one screen.
 *
 * The chevron is `flip`ped: it means "forward", not "right", so it points left
 * in the Arabic layout. Rows are divider-separated rather than carded, because
 * a settings list is one object with many lines, not many objects.
 */
export function SettingsRow({
  label,
  detail,
  icon,
  value,
  valueTone = 'default',
  accessory,
  quiet,
  chevron = true,
  divider,
  onPress,
  className,
}: SettingsRowProps) {
  const Row = onPress ? Pressable : View;
  return (
    <View className={className}>
      <Row
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        className={cn(
          // `px-4 py-3.5` — the same metric `stat-tile`, `vault-row` and
          // `heir-card` use. This row had the vertical half only, so inside the
          // card its callers wrap it in, the icon sat flush against one edge and
          // the chevron against the other.
          'flex-row items-center gap-3 px-4 py-3.5',
          onPress && 'active:opacity-70',
          quiet && 'opacity-80'
        )}>
        {icon ? <Icon as={icon} className="size-4.5 shrink-0 opacity-70" /> : null}

        <View className="min-w-0 flex-1 gap-0.5">
          <Text variant="rowTitle" numberOfLines={1}>
            {label}
          </Text>
          {detail ? (
            <Text variant="metaSm" numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
        </View>

        {value ? (
          <Text
            className={cn(
              'text-meta shrink-0',
              valueTone === 'action' ? 'text-terracotta-700 font-body-semibold' : 'opacity-70'
            )}>
            {value}
          </Text>
        ) : null}

        {accessory ?? (chevron && onPress ? (
          <Icon as={ChevronRight} flip className="size-4 shrink-0 opacity-40" />
        ) : null)}
      </Row>
      {/* Inset to the row's own padding rather than bleeding to the card's
          edges, so the rule starts where the content starts. */}
      {divider ? <View className="bg-border mx-4 h-px" /> : null}
    </View>
  );
}

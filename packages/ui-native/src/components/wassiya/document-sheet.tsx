import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import type * as React from 'react';
import { View } from 'react-native';

export type DocumentSheetProps = {
  /** The document's formal title, in the reader's language. */
  title: string;
  /** Latin sub-title under it ("WASSIYA RECOVERY DOCUMENT"). */
  subtitle?: string;
  /** Top-end slot — the QR code on the recovery sheet. */
  trailing?: React.ReactNode;
  /** Footer meta: owner, date, handling instruction. */
  footer?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * A paper frame for things that are documents rather than UI: the printed
 * recovery sheet, a will preview, a claim record.
 *
 * Lighter than `Card` on purpose. A card is a container in an app; this is
 * meant to read as a **printed page** — the palest ground in the system
 * (sand-100), a hairline rule under the masthead and above the footer, and
 * only the faintest elevation. When the same content is rendered to PDF, this
 * is the layout it should match.
 */
export function DocumentSheet({
  title,
  subtitle,
  trailing,
  footer,
  children,
  className,
}: DocumentSheetProps) {
  return (
    <View
      className={cn(
        'bg-sand-100 border-border gap-3 rounded-box border p-4 shadow-sm',
        className
      )}>
      <View className="flex-row items-start justify-between gap-2.5">
        <View className="flex-1">
          <Text className="font-heading-black text-page">{title}</Text>
          {subtitle ? (
            <Text variant="metaSm" className="font-latin mt-0.5">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {trailing}
      </View>

      <View className="bg-border h-px" />

      {children}

      {footer ? (
        <>
          <View className="bg-border h-px" />
          <Text variant="metaSm">{footer}</Text>
        </>
      ) : null}
    </View>
  );
}

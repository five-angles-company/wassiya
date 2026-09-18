import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { DocumentSheet } from '@workspace/ui-native/components/wassiya/document-sheet';
import { monoFont } from '@workspace/ui-native/lib/fonts';
import { fmtDate } from '@workspace/ui-native/lib/format';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { isolateLtr } from '@workspace/ui-native/lib/rtl';
import { cn } from '@workspace/ui-native/lib/utils';
import { TriangleAlert } from 'lucide-react-native';
import type * as React from 'react';
import { View } from 'react-native';

type DisplayLabelKey = 'documentTitle' | 'documentSubtitle' | 'codeLabel' | 'shownOnce' | 'owner';

const LABELS: LabelSet<DisplayLabelKey> = {
  documentTitle: { ar: 'وثيقة استرداد وصيّة', en: 'Wassiya recovery document' },
  documentSubtitle: { ar: 'WASSIYA RECOVERY DOCUMENT', en: 'WASSIYA RECOVERY DOCUMENT' },
  codeLabel: { ar: 'رمز الاسترداد', en: 'Recovery code' },
  shownOnce: {
    ar: 'تُعرض مرة واحدة فقط. لن نستطيع إظهارها لك مرة أخرى — ولا نحتفظ بنسخة.',
    en: 'Shown once. We cannot show it again — and we keep no copy.',
  },
  owner: { ar: 'صاحب الخزنة', en: 'Vault owner' },
};

export type RecoveryCodeDisplayProps = LabelledProps<DisplayLabelKey> & {
  /** Groups of the code, e.g. ['WSY1','K7M2','4QPX','9TWL','ZR8D','3FHN']. */
  groups: string[];
  /** Groups per printed line. The sheet prints three. */
  perLine?: number;
  ownerName: string;
  issuedAt: Date;
  /** Slot for the QR image — it encodes the wrapped key blob, not the code. */
  qrSlot?: React.ReactNode;
  /** Extra handling instruction appended to the footer. */
  handlingNote?: string;
  className?: string;
};

/**
 * The printed recovery sheet — one of the three keys to the vault.
 *
 * Rendered as a document rather than a UI panel because that is what it
 * becomes: the user prints it and files it with a notarised will. The layout
 * here should match the generated PDF.
 *
 * The code is always Latin, monospaced, and wrapped in an LTR isolate, even in
 * the Arabic UI — it is transcribed character by character by someone under
 * stress, and Arabic-Indic shaping would make that harder, not easier.
 *
 * The shown-once band is not boilerplate. There is genuinely no second copy:
 * the host screen must set `FLAG_SECURE`, and the code must never reach logs,
 * clipboard history, or analytics.
 */
export function RecoveryCodeDisplay({
  groups,
  perLine = 3,
  ownerName,
  issuedAt,
  qrSlot,
  handlingNote,
  locale = 'ar',
  labels,
  className,
}: RecoveryCodeDisplayProps) {
  const t = resolveLabels(LABELS, labels, locale);

  const lines: string[] = [];
  for (let i = 0; i < groups.length; i += perLine) {
    lines.push(groups.slice(i, i + perLine).join(' · '));
  }

  const footer = [`${t.owner}: ${ownerName}`, fmtDate(issuedAt, locale), handlingNote]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className={cn('gap-4', className)}>
      <DocumentSheet
        title={t.documentTitle}
        subtitle={t.documentSubtitle}
        trailing={qrSlot}
        footer={footer}>
        <View className="gap-1.5">
          <Text variant="kicker">{t.codeLabel}</Text>
          <View style={{ direction: 'ltr' }}>
            {lines.map((line) => (
              <Text
                key={line}
                selectable={false}
                className={cn(monoFont, 'font-body-semibold text-body tracking-widest')}>
                {isolateLtr(line)}
              </Text>
            ))}
          </View>
        </View>
      </DocumentSheet>

      <View className="bg-terracotta-100 flex-row gap-2.5 rounded-row p-3.5">
        <Icon as={TriangleAlert} className="text-terracotta-800 mt-0.5 size-4.5" />
        <Text className="text-terracotta-800 flex-1 text-meta">{t.shownOnce}</Text>
      </View>
    </View>
  );
}

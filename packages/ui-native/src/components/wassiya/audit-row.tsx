import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { TONE_DISC_BG, TONE_DISC_FG, type Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

export type AuditRowProps = {
  icon: LucideIcon;
  /** What happened, in past tense: "قبِل خالد المنصوري دعوة الوصاية". */
  event: string;
  /** Time · device · city — the three things that identify an event. */
  meta?: string;
  /** Olive for benign events, terracotta for security-relevant ones. */
  tone?: Tone;
  /** Draw the hairline rule under the row (omit on the last one). */
  divider?: boolean;
  className?: string;
};

/**
 * One entry in the audit log.
 *
 * Deliberately **not pressable and without a chevron**. The audit trail is an
 * immutable record, and a row that looks tappable implies it can be opened,
 * edited, or dismissed. Everything the entry says is already on the row.
 *
 * Every secret reveal writes one of these, which is what makes the 10-second
 * peek in `GuardedSecretField` accountable rather than merely brief.
 */
export function AuditRow({ icon, event, meta, tone = 'sand', divider, className }: AuditRowProps) {
  return (
    <View className={className}>
      <View className="flex-row items-start gap-3 px-1 py-3">
        <View
          className={cn(
            'size-8.5 shrink-0 items-center justify-center rounded-full',
            TONE_DISC_BG[tone]
          )}>
          <Icon as={icon} className={cn('size-4', TONE_DISC_FG[tone])} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="meta">{event}</Text>
          {meta ? <Text variant="metaSm">{meta}</Text> : null}
        </View>
      </View>
      {divider ? <View className="bg-border h-px" /> : null}
    </View>
  );
}

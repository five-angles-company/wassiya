import { Text } from '@workspace/ui-native/components/ui/text';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { TONE_SOFT_BG, TONE_SOFT_FG, type Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

/**
 * The three states anything in the vault can be in. Ranking matters: exactly
 * one `action` item should be visible on a screen at a time (the rule:
 * "exactly one amber row is allowed"), because a wall of amber ranks nothing.
 */
export type StatusPillStatus =
  /** Olive — done, verified, live. */
  | 'confirmed'
  /** Terracotta — the user must do something. */
  | 'action'
  /** Sand — inert, or in someone else's hands. */
  | 'waiting';

const STATUS_TONE: Record<StatusPillStatus, Tone> = {
  confirmed: 'olive',
  action: 'terracotta',
  waiting: 'sand',
};

/**
 * The canonical wording for each state. Kept here so the vocabulary cannot
 * drift per call site — a vault that says "مفعّل" on one screen and "جاهز" on
 * the next is describing two different things as far as the reader knows.
 * Pass `children` only when a surface genuinely needs its own phrasing
 * ("بلا مستلم", "قبل الدعوة").
 */
const LABELS: LabelSet<StatusPillStatus> = {
  confirmed: { ar: 'مفعّل', en: 'active' },
  action: { ar: 'مطلوب', en: 'needed' },
  waiting: { ar: 'قيد المراجعة', en: 'in review' },
};

export type StatusPillProps = LabelledProps<StatusPillStatus> & {
  status: StatusPillStatus;
  /** Overrides the default wording for this status. */
  children?: string;
  className?: string;
};

/**
 * The small tinted label that reports the state of an heir, asset, invite, or
 * protection step.
 *
 * Text-only by design: an icon at 10px is noise, and colour plus a word is
 * already redundant enough to survive colour blindness.
 */
export function StatusPill({
  status,
  children,
  locale = 'ar',
  labels,
  className,
}: StatusPillProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const tone = STATUS_TONE[status];
  return (
    <View
      className={cn('shrink-0 self-start rounded-full px-2.5 py-1', TONE_SOFT_BG[tone], className)}>
      <Text className={cn('font-body-semibold text-kicker', TONE_SOFT_FG[tone])}>
        {children ?? t[status]}
      </Text>
    </View>
  );
}

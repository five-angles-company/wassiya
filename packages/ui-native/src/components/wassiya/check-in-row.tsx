import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { StatusPill } from '@workspace/ui-native/components/wassiya/status-pill';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { Clock } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type CheckInRowLabelKey = 'title' | 'off' | 'due' | 'setUp' | 'open';

const LABELS: LabelSet<CheckInRowLabelKey> = {
  title: { ar: 'التحقق من الحياة', en: 'Life check-in' },
  off: { ar: 'غير مفعّل — فعّله لتكتمل السلسلة', en: 'Off — turn it on to close the chain' },
  due: { ar: 'حان وقت التأكيد', en: 'Time to confirm' },
  setUp: { ar: 'تفعيل', en: 'Set up' },
  open: { ar: 'تأكيد', en: 'Confirm' },
};

export type CheckInRowProps = LabelledProps<CheckInRowLabelKey> & {
  /** `off` = never enabled; `due` = enabled and waiting on a confirmation. */
  state?: 'off' | 'due';
  /** Overrides the subtitle, e.g. a grace countdown. */
  detail?: string;
  /** Navigates to the check-in prompt (6.4). */
  onPress: () => void;
  className?: string;
};

/**
 * The compact life check-in row on Home (3.1).
 *
 * This row **reports and navigates — it never confirms.** Confirming is
 * biometric-gated and lives only in `CheckInPrompt` (6.4); putting a confirm
 * affordance here too would create a second path to the one action in the
 * product that must not be tappable by someone holding an unlocked phone.
 */
export function CheckInRow({
  state = 'off',
  detail,
  onPress,
  locale = 'ar',
  labels,
  className,
}: CheckInRowProps) {
  const t = resolveLabels(LABELS, labels, locale);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={cn(
        'border-border active:bg-muted flex-row items-center gap-3 rounded-row border px-4 py-3.5',
        className
      )}>
      <Icon as={Clock} className="size-4.75 shrink-0 opacity-60" />
      <View className="flex-1 gap-0.5">
        <Text variant="sectionLabel">{t.title}</Text>
        <Text variant="metaSm">{detail ?? (state === 'due' ? t.due : t.off)}</Text>
      </View>
      <StatusPill status="action">{state === 'due' ? t.open : t.setUp}</StatusPill>
    </Pressable>
  );
}

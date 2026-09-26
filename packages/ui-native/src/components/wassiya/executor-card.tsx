import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { InitialDisc } from '@workspace/ui-native/components/wassiya/initial-disc';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import type { Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import { CircleAlert, FileKey } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type ExecutorLabelKey = 'noSheet';

const LABELS: LabelSet<ExecutorLabelKey> = {
  noSheet: {
    ar: 'لم تُطبع ورقته بعد — لن يستطيع فتح شيء',
    en: 'No sheet printed yet — they could open nothing',
  },
};

const AVATAR_TONES: Tone[] = ['olive', 'terracotta', 'sand'];

/** A stable avatar colour per person, deliberately not tied to any state. */
function avatarTone(name: string): Tone {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

export type ExecutorCardProps = LabelledProps<ExecutorLabelKey> & {
  name: string;
  /** Contact line: "‎+966 55 ••• 2210". */
  detail: string;
  /** Already-localised sheet line: "ورقته مطبوعة · ١٢ مارس". Absent means none. */
  sheetSummary?: string;
  tone?: Tone;
  onPress?: () => void;
  className?: string;
};

/**
 * An executor, as shown in the executors list.
 *
 * The footer is the half that matters: an executor with no printed sheet can
 * open nothing at release, and the owner who named them believes the handover
 * is arranged. That state gets the warning glyph and terracotta.
 */
export function ExecutorCard({
  name,
  detail,
  sheetSummary,
  tone,
  locale = 'ar',
  labels,
  onPress,
  className,
}: ExecutorCardProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const Card = onPress ? Pressable : View;
  const hasSheet = Boolean(sheetSummary);

  return (
    <Card
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn('bg-card border border-border rounded-card gap-3 px-4 py-3.5', className)}>
      <View className="flex-row items-center gap-3">
        <InitialDisc name={name} tone={tone ?? avatarTone(name)} size="lg" />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="font-body-semibold text-body" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="metaSm" numberOfLines={1}>
            {detail}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <Icon
          as={hasSheet ? FileKey : CircleAlert}
          className={cn('size-3.75', hasSheet ? 'text-muted-foreground' : 'text-terracotta-700')}
        />
        <Text
          className={cn('flex-1 text-meta', hasSheet ? 'text-muted-foreground' : 'text-terracotta-700')}>
          {sheetSummary ?? t.noSheet}
        </Text>
      </View>
    </Card>
  );
}

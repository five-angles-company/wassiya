import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { InitialDisc } from '@workspace/ui-native/components/wassiya/initial-disc';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import type { Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import { CircleAlert, Wallet } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * There is no invite state any more.
 *
 * The card carried a `StatusPill` reading صامتة / قبل الدعوة / معلّقة / رفض
 * الدعوة. Every heir is silent now, so that pill said the same word on every
 * row — and a status that cannot vary is not a status, it is decoration
 * competing with the one line on this card that *does* change.
 *
 * The promise it used to carry is stated once, on ٥.٢'s form, where someone is
 * deciding to name a person.
 */
type HeirLabelKey = 'receivesNothing';

const LABELS: LabelSet<HeirLabelKey> = {
  receivesNothing: {
    ar: 'لا يستلم شيئاً بعد — وجّه له أصلاً',
    en: 'Receives nothing yet — route something to them',
  },
};

const AVATAR_TONES: Tone[] = ['olive', 'terracotta', 'sand'];

/**
 * A stable avatar colour per person.
 *
 * Deliberately not derived from anything semantic: on the board the disc
 * colours simply vary between people, and tying them to state would give the
 * vault two competing colour languages for the same row.
 */
function avatarTone(name: string): Tone {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

export type HeirCardProps = LabelledProps<HeirLabelKey> & {
  name: string;
  /** Relation plus contact: "ابنة · ‎+966 55 ••• 2210". */
  relation: string;
  /** Already-localised summary: "تستلم ٤ أصول · منها محفظة Ledger". */
  receivesSummary?: string;
  /** Override the avatar colour; defaults to a stable hash of the name. */
  tone?: Tone;
  onPress?: () => void;
  className?: string;
};

/**
 * An heir, as shown in the heirs list.
 *
 * The footer line is the important half of this card. An heir who receives
 * **nothing** is the mirror of an asset with no recipient, and it is surfaced
 * here with a warning glyph rather than left to be inferred from an empty
 * list — a named heir routed nothing is a silent failure of the whole vault.
 */
export function HeirCard({
  name,
  relation,
  receivesSummary,
  tone,
  locale = 'ar',
  labels,
  onPress,
  className,
}: HeirCardProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const Card = onPress ? Pressable : View;
  const routed = Boolean(receivesSummary);

  return (
    <Card
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn('bg-card rounded-card gap-3 px-4 py-3.5', className)}>
      <View className="flex-row items-center gap-3">
        <InitialDisc name={name} tone={tone ?? avatarTone(name)} size="lg" />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="font-body-semibold text-body" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="metaSm" numberOfLines={1}>
            {relation}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <Icon
          as={routed ? Wallet : CircleAlert}
          className={cn('size-3.75', routed ? 'text-muted-foreground' : 'text-terracotta-700')}
        />
        <Text
          className={cn('flex-1 text-meta', routed ? 'text-muted-foreground' : 'text-terracotta-700')}>
          {receivesSummary ?? t.receivesNothing}
        </Text>
      </View>
    </Card>
  );
}

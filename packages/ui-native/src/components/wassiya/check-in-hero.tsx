import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, Fingerprint, Heart } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

/**
 * The heartbeat — one bar across the top of Home.
 *
 * It used to be a tall centred card with a 128px ring motif. On a grid of
 * tiles that reads as two unrelated screens stacked on top of each other, so
 * it's a bar now: state on the start edge, the confirm on the end edge, one
 * row. It still leads the screen, and it is still the only thing on Home that
 * is a *verb* rather than a number.
 *
 * ## ⚠️ The gate, which has not moved
 *
 * `onConfirm` must run a biometric and resolve `false` on anything else. This
 * component records nothing itself, so a tap alone can never say "still alive".
 * That is the property AGENTS.md protects — an unlocked phone in the wrong
 * hands must not be able to suppress delivery forever — and it is the
 * fingerprint that provides it, not the route or the size of the button. The
 * affordance lives here and nowhere else; `screens/protection/checkin` is
 * cadence settings and status only.
 *
 * ## Why the button is here even when nothing is due
 *
 * Confirming early is harmless — it resets the clock, which is the mechanism —
 * and someone about to travel or go into hospital has a real reason to reach
 * for it unprompted. Urgency is carried by tone, not by hiding the control.
 */
export type CheckInHeroState = 'off' | 'confirmed' | 'due' | 'overdue';

type Key =
  | 'offTitle'
  | 'offCta'
  | 'askTitle'
  | 'cta'
  | 'confirming'
  | 'confirmedTitle'
  | 'failed';

const LABELS: LabelSet<Key> = {
  // Named for what it protects, not for the mechanism. "Dead man's switch" is
  // an accurate phrase and a terrible thing to read on your own phone.
  offTitle: { ar: 'نبض الحياة غير مفعّل', en: 'Life check-in is off' },
  offCta: { ar: 'فعّله', en: 'Turn on' },
  askTitle: { ar: 'هل أنت بخير؟', en: 'Are you well?' },
  cta: { ar: 'أنا بخير', en: "I'm well" },
  confirming: { ar: '…', en: '…' },
  confirmedTitle: { ar: 'نبضك مسجَّل', en: "You're checked in" },
  failed: {
    ar: 'لم يتم التحقق. لم يُسجَّل شيء.',
    en: 'Not verified. Nothing was recorded.',
  },
};

export type CheckInHeroProps = LabelledProps<Key> & {
  state: CheckInHeroState;
  /** The next-due line. Short — this is a bar. */
  detail?: string;
  /** MUST run a biometric and resolve `false` if it did not succeed. */
  onConfirm: () => Promise<boolean>;
  /** `off` only: go and choose a cadence. */
  onEnable: () => void;
  /** Opens cadence + escalation settings. */
  onOpenSettings: () => void;
  failed?: boolean;
  className?: string;
};

export function CheckInHero({
  state,
  detail,
  onConfirm,
  onEnable,
  onOpenSettings,
  failed = false,
  locale = 'ar',
  labels,
  className,
}: CheckInHeroProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const [busy, setBusy] = useState(false);

  const settled = state === 'confirmed';
  const off = state === 'off';

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  // Static pairs, never interpolation — Tailwind scans source text, so a
  // composed `bg-${tone}-100` never reaches the bundle.
  const skin = settled
    ? {
        card: 'bg-olive-100',
        disc: 'bg-secondary',
        onDisc: 'text-secondary-foreground',
        title: 'text-olive-800',
        body: 'text-olive-700',
        pill: 'bg-secondary active:bg-olive-600',
        onPill: 'text-secondary-foreground',
      }
    : {
        card: 'bg-terracotta-100',
        disc: 'bg-primary',
        onDisc: 'text-primary-foreground',
        title: 'text-terracotta-800',
        body: 'text-terracotta-700',
        pill: 'bg-primary active:bg-terracotta-600',
        onPill: 'text-primary-foreground',
      };

  return (
    <View className={cn('rounded-card gap-2 p-4', skin.card, className)}>
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={onOpenSettings}
          className="flex-row items-center gap-3"
        >
          <View
            className={cn('size-11 items-center justify-center rounded-full', skin.disc)}
          >
            <Icon
              as={settled ? Check : Heart}
              size={22}
              strokeWidth={settled ? 3.5 : 2.75}
              className={skin.onDisc}
            />
          </View>
        </Pressable>

        <View className="min-w-0 flex-1 gap-0.5">
          <Text variant="rowTitle" numberOfLines={1} className={skin.title}>
            {settled ? t.confirmedTitle : off ? t.offTitle : t.askTitle}
          </Text>
          {detail !== undefined ? (
            <Text numberOfLines={1} className={cn('text-metasm', skin.body)}>
              {detail}
            </Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={off ? onEnable : () => void run()}
          disabled={busy}
          className={cn(
            'h-11 shrink-0 flex-row items-center justify-center gap-2 rounded-full px-4',
            skin.pill
          )}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff2eb" />
          ) : off ? null : (
            <Icon as={Fingerprint} size={17} strokeWidth={2.75} className={skin.onPill} />
          )}
          {/* `shrink-0`: RN lets a Text shrink inside a flex row, and a row
              this tight gives it no width to claim — "أنا بخير" rendered as
              "أنا" with the second word clipped away. */}
          <Text
            variant="metaSm"
            numberOfLines={1}
            className={cn('shrink-0 font-body-bold', skin.onPill)}
          >
            {busy ? t.confirming : off ? t.offCta : t.cta}
          </Text>
        </Pressable>
      </View>

      {failed ? (
        <Text className={cn('text-metasm', skin.title)}>{t.failed}</Text>
      ) : null}
    </View>
  );
}

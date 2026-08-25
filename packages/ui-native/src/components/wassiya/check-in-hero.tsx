import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, Fingerprint, Heart } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

/**
 * The heartbeat — the top of Home, in every state.
 *
 * Declaring you're alive is the only thing anyone does in this app more than
 * once, so it leads the screen and **the confirmation happens right here**.
 *
 * ## ⚠️ The gate, which has not moved
 *
 * `onConfirm` must run a biometric and resolve `false` on anything else. This
 * component records nothing itself, so a tap alone can never say "still alive".
 * That is the property AGENTS.md protects — an unlocked phone in the wrong
 * hands must not be able to suppress delivery forever — and a fingerprint-gated
 * button on Home satisfies it exactly as well as one on a separate screen. The
 * affordance *moved* here; it was not added alongside another, and
 * `screens/protection/checkin` no longer offers a confirm of its own.
 *
 * ## Why the button is here even when nothing is due
 *
 * Confirming early is harmless — it resets the clock, which is the whole
 * mechanism — and an owner about to travel, go into hospital, or simply be out
 * of reach for a while has a real reason to reach for it unprompted. Hiding the
 * button until the app asks would mean the one thing people come here to do is
 * missing most of the time they look.
 *
 * Tone carries the urgency instead of size: olive when the clock is healthy,
 * terracotta when an answer is wanted or the switch was never turned on.
 */
export type CheckInHeroState =
  /** Never set up — the switch isn't running at all. */
  | 'off'
  /** Running and satisfied. */
  | 'confirmed'
  /** A confirmation is wanted now. */
  | 'due'
  /** Past the grace window — escalation has started. */
  | 'overdue';

type Key =
  | 'offTitle'
  | 'offBody'
  | 'offCta'
  | 'askTitle'
  | 'askBody'
  | 'cta'
  | 'confirming'
  | 'confirmedTitle'
  | 'settings'
  | 'failed';

const LABELS: LabelSet<Key> = {
  // Named for what it protects, not for the mechanism. "Dead man's switch" is
  // an accurate phrase and a terrible thing to read on your own phone.
  offTitle: { ar: 'نبض الحياة غير مفعّل', en: 'Life check-in is off' },
  offBody: {
    ar: 'اختر كل كم شهر نطمئن عليك.',
    en: 'Choose how often we check on you.',
  },
  offCta: { ar: 'فعّله الآن', en: 'Turn it on' },
  askTitle: { ar: 'هل أنت بخير؟', en: 'Are you well?' },
  askBody: { ar: 'تأكيد واحد ببصمتك، ويعود العدّ من جديد.', en: 'One touch, and the clock resets.' },
  cta: { ar: 'أنا بخير', en: "I'm well" },
  confirming: { ar: 'جارٍ التأكيد…', en: 'Confirming…' },
  confirmedTitle: { ar: 'نبضك مسجَّل', en: "You're checked in" },
  settings: { ar: 'إعدادات النبض', en: 'Check-in settings' },
  failed: {
    ar: 'لم يتم التحقق من بصمتك. لم يُسجَّل شيء — حاول مرة أخرى.',
    en: "Your fingerprint wasn't verified. Nothing was recorded — try again.",
  },
};

export type CheckInHeroProps = LabelledProps<Key> & {
  state: CheckInHeroState;
  /** Last-confirmed / next-due, or the escalation note. Formatted by the caller. */
  detail?: string;
  /**
   * MUST run a biometric and resolve `false` if it did not succeed. See above —
   * this is the gate, and the component trusts nothing else.
   */
  onConfirm: () => Promise<boolean>;
  /** `off` only: go and choose a cadence. */
  onEnable: () => void;
  /** Opens cadence + escalation settings. */
  onOpenSettings: () => void;
  /** Surfaces the "not verified" line after a declined prompt. */
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

  // Static class pairs, never interpolation — Tailwind reads source text, so a
  // composed `bg-${tone}-100` is invisible to it and silently drops out.
  const skin = settled
    ? {
        card: 'bg-olive-100',
        accent: 'bg-olive-200',
        ring: 'bg-olive-200',
        disc: 'bg-secondary',
        onDisc: 'text-secondary-foreground',
        title: 'text-olive-800',
        body: 'text-olive-700',
        pill: 'bg-secondary active:bg-olive-600',
        onPill: 'text-secondary-foreground',
      }
    : {
        card: 'bg-terracotta-100',
        accent: 'bg-terracotta-200',
        ring: 'bg-terracotta-200',
        disc: 'bg-primary',
        onDisc: 'text-primary-foreground',
        title: 'text-terracotta-800',
        body: 'text-terracotta-700',
        pill: 'bg-primary active:bg-terracotta-600',
        onPill: 'text-primary-foreground',
      };

  return (
    <View
      className={cn('rounded-summary overflow-hidden px-5 pb-5 pt-7', skin.card, className)}
    >
      {/* A washed circle bleeding off the top-start corner. The design system
          asks for soft circular shapes as decoration; without it the card is a
          flat tinted rectangle, which is what made this read as a wireframe. */}
      <View className={cn('absolute -top-16 -start-14 size-44 rounded-full opacity-60', skin.accent)} />

      {/* Concentric rings — held still, never animated. A beating heart on the
          screen that asks whether you are alive is a different and much worse
          thing than a calm one. */}
      <View className="items-center">
        <View className={cn('size-32 items-center justify-center rounded-full', skin.ring)}>
          <View
            className={cn(
              'size-21.5 items-center justify-center rounded-full shadow-md',
              skin.disc
            )}
          >
            <Icon
              as={settled ? Check : Heart}
              size={38}
              strokeWidth={settled ? 3.5 : 2.75}
              className={skin.onDisc}
            />
          </View>
        </View>
      </View>

      <Text variant="h1" className={cn('mt-5 text-center', skin.title)}>
        {settled ? t.confirmedTitle : off ? t.offTitle : t.askTitle}
      </Text>
      <Text className={cn('text-prose-sm mt-1.5 text-center', skin.body)}>
        {detail ?? (off ? t.offBody : t.askBody)}
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={off ? onEnable : () => void run()}
        disabled={busy}
        className={cn(
          'mt-5 h-14 flex-row items-center justify-center gap-2.5 rounded-full',
          skin.pill
        )}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#fff2eb" />
        ) : off ? null : (
          <Icon as={Fingerprint} size={20} strokeWidth={2.75} className={skin.onPill} />
        )}
        {/* `shrink-0`: React Native lets a Text shrink inside a flex row, and
            a centred row gives it no width to claim — "أنا بخير" rendered as
            "أنا" with the second word clipped away. */}
        <Text
          variant="rowTitle"
          numberOfLines={1}
          className={cn('shrink-0 font-body-bold', skin.onPill)}
        >
          {busy ? t.confirming : off ? t.offCta : t.cta}
        </Text>
      </Pressable>

      {failed ? (
        <Text className={cn('text-metasm mt-3 text-center leading-[1.6]', skin.title)}>
          {t.failed}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onOpenSettings}
        className="mt-3.5 items-center py-1"
      >
        <Text className={cn('text-metasm font-body-semibold', skin.body)}>{t.settings}</Text>
      </Pressable>
    </View>
  );
}

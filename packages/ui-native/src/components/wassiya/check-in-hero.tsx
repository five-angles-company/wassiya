import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { PulsingHeart } from '@workspace/ui-native/components/wassiya/pulsing-heart';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, Fingerprint } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

/**
 * The heartbeat — the top of Home, and the only thing on it that is a *verb*
 * rather than a number.
 *
 * The heart beats. It is the one animation in the product and it earns its
 * place: the whole screen asks whether you are alive, and a still icon answers
 * that less well than a pulse does. `PulsingHeart` carries the rhythm — a real
 * lub-dub, not a scale loop — and honours reduced-motion.
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
  offBody: { ar: 'اختر كل كم شهر نطمئن عليك.', en: 'Choose how often we check on you.' },
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
        title: 'text-olive-800',
        body: 'text-olive-700',
        pill: 'bg-secondary active:bg-olive-600',
        onPill: 'text-secondary-foreground',
        badge: 'bg-secondary',
        onBadge: 'text-secondary-foreground',
      }
    : {
        card: 'bg-terracotta-100',
        title: 'text-terracotta-800',
        body: 'text-terracotta-700',
        pill: 'bg-primary active:bg-terracotta-600',
        onPill: 'text-primary-foreground',
        badge: 'bg-primary',
        onBadge: 'text-primary-foreground',
      };

  return (
    <View
      className={cn('rounded-summary px-5 pb-5 pt-6', skin.card, className)}
    >
      <View className="items-center">
        <View>
          <PulsingHeart tone={settled ? 'olive' : 'terracotta'} />
          {/* The heart stays the motif in every state; a check rides its rim
              when the clock is satisfied, rather than replacing it. The disc is
              60px and the ripple expands from that same edge, so the badge sits
              on the corner rather than floating out in a halo. */}
          {settled ? (
            <View
              className={cn(
                'border-olive-100 absolute -bottom-1 -end-1 size-7 items-center justify-center rounded-full border-[3px]',
                skin.badge
              )}
            >
              <Icon as={Check} size={13} strokeWidth={3.5} className={skin.onBadge} />
            </View>
          ) : null}
        </View>
      </View>

      <Text variant="h1" className={cn('mt-4 text-center', skin.title)}>
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
        {/* `shrink-0`: RN lets a Text shrink inside a centred flex row, which
            rendered "أنا بخير" as "أنا" with the second word clipped away. */}
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

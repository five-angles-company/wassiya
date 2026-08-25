import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import {
  TONE_SOFT_BG,
  TONE_SOFT_FG,
  TONE_SOLID_BG,
  TONE_SOLID_FG,
  type Tone,
} from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, Heart } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * The heartbeat, at the top of Home.
 *
 * Declaring you're alive is the only thing anyone does in this app more than
 * once, so it gets the most space. Everything else on Home answers a question
 * you ask rarely; this answers the one you'll answer four times a year for
 * thirty years.
 *
 * ## ⚠️ This element NAVIGATES. It must never confirm.
 *
 * AGENTS.md: *"Life check-in confirmation is ALWAYS biometric-gated and exists
 * in exactly one place (the check-in prompt) — no alternate confirm affordance
 * may ever be added (rows, notifications, widgets report and navigate only), or
 * an unlocked phone in the wrong hands could suppress delivery forever."*
 *
 * That last clause is the reason. Someone holding an unlocked phone who can tap
 * "I'm well" can keep the dead man's switch from firing, and the family never
 * receives the vault — a silent, permanent failure nobody discovers until far
 * too late. So this takes `onPress`, not `onConfirm`, and there is no mutation
 * anywhere beneath it. The fingerprint lives in `CheckInPrompt` and nowhere
 * else. The prominence the owner wants and the guarantee the model needs are
 * not in conflict: this is the biggest thing on the screen, and one tap from it
 * is a fingerprint.
 *
 * ## Why the badge here is 48px and not `HeartBadge`
 *
 * `HeartBadge` is the 220px concentric disc built for the full-screen prompt,
 * where it is the entire composition. Dropped into a card it swallows the
 * width, squeezes the title into a one-word-per-line column, and — being
 * hardcoded olive — renders a reassuring green heart on a switch that is
 * *off*. A hero badge has to take its colour from the state, so it's built
 * here from the tone ramps instead.
 */
export type CheckInHeroState =
  /** Never set up — the switch isn't running at all. */
  | 'off'
  /** Running and satisfied; nothing to do. */
  | 'confirmed'
  /** A confirmation is wanted now. */
  | 'due'
  /** Past the grace window — escalation has started. */
  | 'overdue';

type Key = 'offTitle' | 'offCta' | 'askTitle' | 'cta' | 'confirmedTitle';

const LABELS: LabelSet<Key> = {
  // Named for what it protects, not for the mechanism. "Dead man's switch" is
  // an accurate phrase and a terrible thing to read on your own phone.
  // States *what*, never *why*. The readiness verdict directly below this card
  // carries the consequence ("ولن يُسلَّم شيء") — putting it in both places was
  // the same sentence twice in two weights, which is what this redesign is for.
  offTitle: { ar: 'نبض الحياة غير مفعّل', en: 'Life check-in is off' },
  offCta: { ar: 'فعّله الآن', en: 'Turn it on' },
  askTitle: { ar: 'هل أنت بخير؟', en: 'Are you well?' },
  cta: { ar: 'أنا بخير', en: "I'm well" },
  confirmedTitle: { ar: 'نبضك مسجَّل', en: "You're checked in" },
};

/**
 * `off` is terracotta, not sand.
 *
 * Sand means inert — pending, in someone else's hands, nothing to do. A check-in
 * that was never set up is the opposite: it is the single gap that stops every
 * delivery, because the switch is what triggers them. Drawing it as inert says
 * "this is fine" about the most consequential hole in the vault.
 */
const TONE: Record<CheckInHeroState, Tone> = {
  off: 'terracotta',
  confirmed: 'olive',
  due: 'terracotta',
  overdue: 'terracotta',
};

export type CheckInHeroProps = LabelledProps<Key> & {
  state: CheckInHeroState;
  /**
   * The supporting line: last-confirmed and next-due when settled, or the
   * escalation note when overdue. Formatted by the caller, which owns the
   * locale and the clock.
   */
  detail?: string;
  /** Opens the check-in prompt. Never confirms — see the note above. */
  onPress: () => void;
  className?: string;
};

export function CheckInHero({
  state,
  detail,
  onPress,
  locale = 'ar',
  labels,
  className,
}: CheckInHeroProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const tone = TONE[state];
  const settled = state === 'confirmed';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'rounded-summary gap-4 p-5',
        TONE_SOFT_BG[tone],
        'active:opacity-90',
        className
      )}
    >
      <View className="flex-row items-center gap-3.5">
        <View
          className={cn(
            'size-12 items-center justify-center rounded-full',
            TONE_SOLID_BG[tone]
          )}
        >
          <Icon
            as={settled ? Check : Heart}
            size={24}
            strokeWidth={settled ? 3.5 : 2.75}
            className={TONE_SOLID_FG[tone]}
          />
        </View>
        <Text variant="title" className={cn('min-w-0 flex-1', TONE_SOFT_FG[tone])}>
          {settled ? t.confirmedTitle : state === 'off' ? t.offTitle : t.askTitle}
        </Text>
      </View>

      {detail !== undefined ? (
        <Text className={cn('text-prose-sm', TONE_SOFT_FG[tone])}>{detail}</Text>
      ) : null}

      {/* Styled as a button, but the whole card is the Pressable — this is a
          visual affordance rather than a second tap target. Either way it opens
          the prompt; neither confirms. */}
      {settled ? null : (
        <View
          className={cn(
            'items-center rounded-full px-5 py-3.5',
            TONE_SOLID_BG[tone]
          )}
        >
          <Text
            variant="rowTitle"
            className={cn('font-body-bold', TONE_SOLID_FG[tone])}
          >
            {state === 'off' ? t.offCta : t.cta}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

import { Button } from '@workspace/ui-native/components/ui/button';
import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { HeartBadge } from '@workspace/ui-native/components/wassiya/heart-badge';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, Clock, Fingerprint } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

export type CheckInState =
  /** The normal ask. */
  | 'due'
  /** Past the deadline — warmed accents, escalation is closer. */
  | 'overdue'
  /** Just confirmed. Badge and copy swap; the primary is spent. */
  | 'confirmed'
  /** Deferred; the chip carries the new date. */
  | 'snoozed'
  /** The gate rejected the attempt. Error line + retry. */
  | 'biometricFailed';

type CheckInLabelKey =
  | 'cadence'
  | 'question'
  | 'body'
  | 'lastConfirmed'
  | 'confirm'
  | 'confirmed'
  | 'confirmedTitle'
  | 'confirmedBody'
  | 'biometricNote'
  | 'biometricFailed'
  | 'retry'
  | 'snooze'
  | 'snoozedUntil';

const LABELS: LabelSet<CheckInLabelKey> = {
  cadence: { ar: 'تذكير دوري', en: 'Regular reminder' },
  question: { ar: 'هل أنت بخير؟', en: 'Are you well?' },
  body: {
    ar: 'تأكيد واحد يُعيد ضبط المهلة. لا شيء يتحرّك في خزنتك حتى نسمع منك.',
    en: 'One confirmation resets the clock. Nothing moves in your vault until we hear from you.',
  },
  lastConfirmed: { ar: 'آخر تأكيد', en: 'Last confirmed' },
  confirm: { ar: 'أنا بخير', en: "I'm fine" },
  confirmed: { ar: 'تم التأكيد', en: 'Confirmed' },
  confirmedTitle: { ar: 'شكراً لك', en: 'Thank you' },
  confirmedBody: {
    ar: 'أُعيد ضبط المهلة. سنسألك مرة أخرى في موعدها.',
    en: 'The clock is reset. We will ask again at the next reminder.',
  },
  biometricNote: {
    ar: 'يتطلّب بصمتك — لمنع أي تأكيد نيابة عنك',
    en: 'Requires your fingerprint — so nobody can confirm on your behalf',
  },
  biometricFailed: {
    ar: 'لم نتعرّف على بصمتك. حاول مرة أخرى.',
    en: 'We did not recognise your fingerprint. Try again.',
  },
  retry: { ar: 'إعادة المحاولة', en: 'Try again' },
  snooze: { ar: 'أجّل ٧ أيام', en: 'Remind me in 7 days' },
  snoozedUntil: { ar: 'سنسألك مرة أخرى', en: 'We will ask again on' },
};

export type CheckInPromptProps = LabelledProps<CheckInLabelKey> & {
  state?: CheckInState;
  /** Cadence, already localised: "كل ٣ أشهر". */
  cadence?: string;
  /** Last confirmation, already formatted: "٢٢ مايو ٢٠٢٦". */
  lastConfirmedAt?: string;
  /** When snoozed: the new ask date, already formatted. */
  snoozedUntil?: string;
  /**
   * Gate for confirming. Return `true` to record the check-in. Attach
   * biometrics here — this is the ONLY confirmation path in the product, and a
   * tap alone must not be able to say "still alive".
   */
  onConfirm: () => Promise<boolean> | boolean;
  onSnooze?: () => void;
  className?: string;
};

/**
 * The life check-in, screen 6.4 — a **full-screen centred prompt**, not a
 * dashboard card.
 *
 * From the board: "the whole screen is sage — this is the one moment the app
 * asks after the person, not the vault." That framing is the reason it gets a
 * screen to itself: a check-in squeezed into a card next to storage usage
 * reads as a chore, and the thing being asked is whether someone is alive.
 *
 * This is the content, not the route: a screen under `app/` wraps it. Home
 * shows the compact `CheckInRow` instead, which only navigates here — there is
 * deliberately no second confirm button anywhere in the app.
 */
export function CheckInPrompt({
  state = 'due',
  cadence,
  lastConfirmedAt,
  snoozedUntil,
  onConfirm,
  onSnooze,
  locale = 'ar',
  labels,
  className,
}: CheckInPromptProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const [busy, setBusy] = React.useState(false);

  const confirmed = state === 'confirmed';
  const overdue = state === 'overdue';
  const failed = state === 'biometricFailed';

  async function handleConfirm() {
    if (busy || confirmed) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  const chipText =
    state === 'snoozed' && snoozedUntil
      ? `${t.snoozedUntil} · ${snoozedUntil}`
      : cadence
        ? `${t.cadence} · ${cadence}`
        : t.cadence;

  return (
    <View className={cn('flex-1 items-center px-gutter py-6', className)}>
      {/* Cadence chip. Overdue warms it a step down the ramp — the palette has
          no true amber, so urgency is depth of terracotta, not a hue change. */}
      <View
        className={cn(
          'mb-7 flex-row items-center gap-1.5 rounded-full px-3 py-1.5',
          overdue ? 'bg-terracotta-300' : 'bg-terracotta-100'
        )}>
        <Icon as={Clock} className="text-terracotta-900 size-3.25" />
        <Text className="text-terracotta-900 text-metasm">{chipText}</Text>
      </View>

      <HeartBadge confirmed={confirmed} className="mb-7.5" />

      <Text
        variant="display"
        className={cn('mb-3 text-prompt text-center', overdue && 'text-terracotta-800')}>
        {confirmed ? t.confirmedTitle : t.question}
      </Text>

      <Text className="text-body max-w-75 text-center leading-[1.7] opacity-75">
        {confirmed ? t.confirmedBody : t.body}
      </Text>

      {lastConfirmedAt ? (
        <Text className="text-meta mt-5 text-center opacity-55">
          {`${t.lastConfirmed}: ${lastConfirmedAt}`}
        </Text>
      ) : null}

      {/* Actions sit at the bottom of the screen, away from the question. */}
      <View className="mt-auto w-full gap-3 pt-8">
        {failed ? (
          <Text className="text-terracotta-700 font-body-medium text-meta text-center">
            {t.biometricFailed}
          </Text>
        ) : null}

        <Button
          variant="protect"
          disabled={busy || confirmed}
          onPress={() => void handleConfirm()}
          className="h-14.5 w-full">
          <Icon as={Check} className="size-5.5" />
          <Text className="text-page">{confirmed ? t.confirmed : failed ? t.retry : t.confirm}</Text>
        </Button>

        {!confirmed ? (
          <View className="flex-row items-center justify-center gap-1.5">
            <Icon as={Fingerprint} className="text-muted-foreground size-3.75" />
            <Text className="text-metasm opacity-60">{t.biometricNote}</Text>
          </View>
        ) : null}

        {onSnooze && !confirmed ? (
          <Button variant="ghost" onPress={onSnooze} className="h-12 w-full">
            <Text className="text-notice">{t.snooze}</Text>
          </Button>
        ) : null}
      </View>
    </View>
  );
}

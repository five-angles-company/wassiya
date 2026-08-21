import { Button } from '@workspace/ui-native/components/ui/button';
import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { SafetyChips } from '@workspace/ui-native/components/wassiya/safety-chips';
import {
  SecretChecksumLine,
  type SecretChecksum,
} from '@workspace/ui-native/components/wassiya/secret-checksum-line';
import { SecretWordPills } from '@workspace/ui-native/components/wassiya/secret-word-pills';
import { fmtNum } from '@workspace/ui-native/lib/format';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { ClipboardPaste, Eye, Lock, ScanLine } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

type GuardedLabelKey =
  | 'guardedField'
  | 'hidden'
  | 'reveal'
  | 'hide'
  | 'paste'
  | 'scanQr'
  | 'words'
  | 'checksumValid'
  | 'checksumInvalid';

const LABELS: LabelSet<GuardedLabelKey> = {
  guardedField: { ar: 'حقل محمي', en: 'guarded field' },
  hidden: { ar: 'مخفية', en: 'hidden' },
  reveal: { ar: 'إظهار', en: 'Reveal' },
  hide: { ar: 'إخفاء', en: 'Hide' },
  paste: { ar: 'لصق', en: 'Paste' },
  scanQr: { ar: 'مسح QR', en: 'Scan QR' },
  words: { ar: 'كلمة', en: 'words' },
  checksumValid: {
    ar: 'كلمات صحيحة · تحقّقنا من رقم التدقيق قبل الحفظ',
    en: 'valid words · checksum verified before saving',
  },
  checksumInvalid: {
    ar: 'رقم التدقيق غير صحيح — راجع الكلمات قبل الحفظ',
    en: 'Checksum does not match — check the words before saving',
  },
};

/** Re-exported so callers do not need to reach into the sub-component. */
export type GuardedSecretChecksum = SecretChecksum;

export type GuardedSecretFieldProps = LabelledProps<GuardedLabelKey> & {
  /** Field name shown in the header row ("العبارة السرّية"). */
  title: string;
  /** How many words the secret has; drives the mask and the summary line. */
  wordCount: number;
  /** The plaintext words. Pass them only when the caller can produce them. */
  words?: string[];
  /**
   * Gate for revealing. Return `true` to unlock. Attach biometrics here —
   * the component never decides on its own that a peek is allowed.
   */
  onRequestReveal?: () => Promise<boolean>;
  /** Seconds the plaintext stays visible before auto-hiding. */
  revealSeconds?: number;
  onPaste?: () => void;
  onScanQr?: () => void;
  /** Protections in force on this screen; see {@link SafetyChips}. */
  safetyChips?: string[];
  checksum?: GuardedSecretChecksum;
  className?: string;
};

/**
 * The capture-and-review surface for a secret that must never touch a normal
 * text field — a BIP-39 seed phrase, an exchange credential, a private key.
 *
 * Deliberate properties:
 *  - **Masked by default**, showing only the word count, so length is
 *    verifiable without exposure.
 *  - **Reveal is gated and self-cancelling.** `onRequestReveal` is where the
 *    caller attaches biometrics; the peek then auto-hides after
 *    `revealSeconds` (10 on the board) whether or not the user acts.
 *  - **Paste and Scan QR are first-class**, because the alternative is the
 *    user retyping 12 words and getting one wrong.
 *
 * The screen hosting this must still set `FLAG_SECURE`, disable personalised
 * keyboard learning, and wipe the clipboard after a paste. This component
 * renders the promise; it cannot keep it alone.
 */
export function GuardedSecretField({
  title,
  wordCount,
  words,
  onRequestReveal,
  revealSeconds = 10,
  onPaste,
  onScanQr,
  safetyChips,
  checksum = 'unknown',
  locale = 'ar',
  labels,
  className,
}: GuardedSecretFieldProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const [revealed, setRevealed] = React.useState(false);
  const [remaining, setRemaining] = React.useState(revealSeconds);

  // Auto-hide. The timer is the security control, so it runs off `revealed`
  // alone and is torn down on unmount — navigating away must not leave a
  // revealed secret behind in a cached screen. The countdown is seeded where
  // the reveal is granted, not here: seeding it in the effect body would kick
  // off a second render pass on every reveal.
  React.useEffect(() => {
    if (!revealed) return;
    const id = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRevealed(false);
          return revealSeconds;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [revealed, revealSeconds]);

  function hide() {
    setRevealed(false);
    setRemaining(revealSeconds);
  }

  async function toggleReveal() {
    if (revealed) {
      hide();
      return;
    }
    const allowed = onRequestReveal ? await onRequestReveal() : true;
    if (!allowed) return;
    setRemaining(revealSeconds);
    setRevealed(true);
  }

  const summary = revealed
    ? `${fmtNum(remaining, locale)}s`
    : `${fmtNum(wordCount, locale)} ${t.words} · ${t.hidden}`;

  return (
    <View
      className={cn(
        'bg-terracotta-100 border-terracotta-300 gap-3 rounded-card border-[1.5px] p-4',
        className
      )}>
      <View className="flex-row items-center gap-2.5">
        <Icon as={Lock} className="text-terracotta-900 size-4.5" />
        <Text className="text-terracotta-900 flex-1 font-body-bold text-section">{title}</Text>
        <Text className="text-terracotta-900 text-kicker">{t.guardedField}</Text>
      </View>

      <View className="bg-background border-terracotta-200 gap-3 rounded-box border p-3.5">
        <SecretWordPills count={wordCount} words={words} revealed={revealed} />
        <View className="flex-row items-center justify-between gap-2">
          <Text variant="metaSm">{summary}</Text>
          <Pressable
            onPress={() => void toggleReveal()}
            accessibilityRole="button"
            className="flex-row items-center gap-1.5">
            <Icon as={Eye} className="text-terracotta-700 size-3.5" />
            <Text variant="action">{revealed ? t.hide : t.reveal}</Text>
          </Pressable>
        </View>
      </View>

      {onPaste || onScanQr ? (
        <View className="flex-row gap-row">
          {onPaste ? (
            <Button size="xs" onPress={onPaste} className="flex-1">
              <Icon as={ClipboardPaste} className="size-4" />
              <Text>{t.paste}</Text>
            </Button>
          ) : null}
          {onScanQr ? (
            <Button size="xs" variant="outline" onPress={onScanQr} className="flex-1">
              <Icon as={ScanLine} className="size-4" />
              <Text>{t.scanQr}</Text>
            </Button>
          ) : null}
        </View>
      ) : null}

      {safetyChips?.length ? <SafetyChips items={safetyChips} /> : null}

      <SecretChecksumLine
        checksum={checksum}
        validMessage={`${fmtNum(wordCount, locale)} ${t.checksumValid}`}
        invalidMessage={t.checksumInvalid}
      />
    </View>
  );
}

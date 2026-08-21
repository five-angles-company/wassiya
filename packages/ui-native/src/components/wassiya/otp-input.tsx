import { Text } from '@workspace/ui-native/components/ui/text';
import { fmtDuration, toLatinDigits } from '@workspace/ui-native/lib/format';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import * as React from 'react';
import { Platform, TextInput, View } from 'react-native';

import { OtpBox } from '@workspace/ui-native/components/wassiya/otp-box';

export type OtpInputState =
  /** Nothing typed yet. */
  | 'empty'
  /** Some digits entered; one box is focused. */
  | 'partial'
  /** Submitted, waiting on the server — boxes pulse. */
  | 'verifying'
  /** Rejected — boxes shake and take the error tint. */
  | 'wrong'
  /** The code aged out; the user must request a new one. */
  | 'expired'
  /** Too many attempts; input is disabled until the cooldown ends. */
  | 'lockedOut';

type OtpLabelKey = 'expired' | 'lockedOut' | 'wrong' | 'resendIn' | 'accessibilityLabel';

const LABELS: LabelSet<OtpLabelKey> = {
  wrong: { ar: 'رمز غير صحيح — حاول مرة أخرى', en: 'That code is not right — try again' },
  expired: { ar: 'انتهت صلاحية الرمز', en: 'This code has expired' },
  lockedOut: { ar: 'محاولات كثيرة. انتظر قليلاً.', en: 'Too many attempts. Wait a moment.' },
  resendIn: { ar: 'إعادة الإرسال بعد', en: 'Resend in' },
  accessibilityLabel: { ar: 'رمز التحقق', en: 'Verification code' },
};

export type OtpInputProps = LabelledProps<OtpLabelKey> & {
  value: string;
  onChangeText: (value: string) => void;
  /** Board default is 6; the wizard supports 4–8. */
  length?: number;
  state?: OtpInputState;
  /** Seconds until resend unlocks. Hidden when undefined or 0. */
  resendInSeconds?: number;
  onComplete?: (value: string) => void;
  autoFocus?: boolean;
  className?: string;
};

/**
 * The one-time-code field.
 *
 * UI only — this component proves nothing and calls no auth API. Wiring it to
 * Clerk's `signIn.emailCode` flow happens at the screen level.
 *
 * Three details that are easy to get wrong and are handled here:
 *
 *  - **The boxes stay left-to-right in Arabic.** Digits are entered LTR
 *    regardless of UI direction, so the row sets `flex-row` explicitly and is
 *    not mirrored. Getting this wrong makes SMS autofill land backwards.
 *  - **One real input, N painted boxes.** A `TextInput` per box breaks
 *    Android's SMS Retriever autofill and paste; instead a single transparent,
 *    full-width input sits over the row and the boxes render its value.
 *  - **Auto-advance and paste come free** from that single input: any string
 *    is filtered to digits and truncated to `length`.
 */
export function OtpInput({
  value,
  onChangeText,
  length = 6,
  state = 'empty',
  resendInSeconds,
  onComplete,
  autoFocus,
  locale = 'ar',
  labels,
  className,
}: OtpInputProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const inputRef = React.useRef<TextInput>(null);
  const disabled = state === 'lockedOut' || state === 'verifying';
  const digits = [...value].slice(0, length);

  function handleChange(next: string) {
    // Convert before filtering: an Arabic keyboard emits ٠-٩, and stripping
    // those as "not digits" would leave the field stubbornly empty with no
    // explanation. The boxes themselves always show Latin.
    const cleaned = toLatinDigits(next).replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(cleaned);
    if (cleaned.length === length) onComplete?.(cleaned);
  }

  const message =
    state === 'wrong' ? t.wrong : state === 'expired' ? t.expired : state === 'lockedOut' ? t.lockedOut : null;

  return (
    <View className={cn('gap-3', className)}>
      <View className="relative">
        {/* Painted boxes. `dir` stays LTR: digits fill left-to-right even in an
            Arabic layout, which is what every SMS autofill implementation assumes. */}
        <View className="flex-row gap-row" style={{ direction: 'ltr' }}>
          {Array.from({ length }, (_, index) => (
            <OtpBox
              key={index}
              char={digits[index] ?? ''}
              state={state}
              focused={!disabled && index === digits.length}
            />
          ))}
        </View>

        {/* The single real input, stretched over the boxes and made invisible.
            `opacity-0` rather than `display:none` — a hidden input cannot take
            focus, and this one must, for the keyboard and for paste. */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          inputMode="numeric"
          textContentType="oneTimeCode"
          autoComplete={Platform.select({ android: 'sms-otp', default: 'one-time-code' })}
          maxLength={length}
          editable={!disabled}
          autoFocus={autoFocus}
          caretHidden
          accessibilityLabel={t.accessibilityLabel}
          className="absolute inset-0 h-full w-full text-transparent opacity-0"
        />
      </View>

      {message ? (
        <Text className="text-terracotta-700 font-body-medium text-meta">{message}</Text>
      ) : null}

      {resendInSeconds ? (
        <Text variant="metaSm">{`${t.resendIn} ${fmtDuration(resendInSeconds, locale)}`}</Text>
      ) : null}
    </View>
  );
}

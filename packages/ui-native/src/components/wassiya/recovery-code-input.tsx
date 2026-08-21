import { Text } from '@workspace/ui-native/components/ui/text';
import { monoFont } from '@workspace/ui-native/lib/fonts';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import * as React from 'react';
import { TextInput, View } from 'react-native';

type InputLabelKey = 'hint' | 'groupError' | 'checksumError';

const LABELS: LabelSet<InputLabelKey> = {
  hint: {
    ar: 'أدخل الرمز من وثيقة الاسترداد المطبوعة',
    en: 'Enter the code from your printed recovery sheet',
  },
  groupError: { ar: 'مجموعة غير مكتملة', en: 'Incomplete group' },
  checksumError: {
    ar: 'الرمز غير صحيح — تحقّق من الحروف وأعد المحاولة',
    en: 'That code is not valid — check the characters and try again',
  },
};

export type RecoveryCodeInputProps = LabelledProps<InputLabelKey> & {
  /** One string per group; length defines the number of boxes. */
  value: string[];
  onChange: (value: string[]) => void;
  /** Characters per group. */
  groupLength?: number;
  /** Indices of groups that failed their own format check. */
  invalidGroups?: number[];
  /** True when every group is well-formed but the code as a whole is wrong. */
  checksumFailed?: boolean;
  className?: string;
};

/**
 * Grouped entry for a printed recovery code.
 *
 * A separate input per group, not one long field: the code is transcribed from
 * paper in four-character chunks, and matching the input to the printed shape
 * is what keeps people from losing their place. Typing a full group advances
 * focus; backspacing an empty group steps back.
 *
 * Errors are reported at two levels because they have different fixes — a bad
 * *group* means a mistyped character in a known place, a bad *checksum* means
 * the whole code is wrong and re-reading one box will not help.
 *
 * Always Latin and LTR: see {@link RecoveryCodeDisplay} for why.
 */
export function RecoveryCodeInput({
  value,
  onChange,
  groupLength = 4,
  invalidGroups,
  checksumFailed,
  locale = 'ar',
  labels,
  className,
}: RecoveryCodeInputProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const refs = React.useRef<(TextInput | null)[]>([]);

  function setGroup(index: number, raw: string) {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // A paste lands entirely in one box; spread it across the rest.
    if (cleaned.length > groupLength) {
      const next = [...value];
      let cursor = 0;
      for (let i = index; i < next.length && cursor < cleaned.length; i++) {
        next[i] = cleaned.slice(cursor, cursor + groupLength);
        cursor += groupLength;
      }
      onChange(next);
      refs.current[Math.min(next.length - 1, index + Math.ceil(cleaned.length / groupLength) - 1)]?.focus();
      return;
    }

    const next = [...value];
    next[index] = cleaned;
    onChange(next);
    if (cleaned.length === groupLength) refs.current[index + 1]?.focus();
  }

  const error = checksumFailed ? t.checksumError : invalidGroups?.length ? t.groupError : null;

  return (
    <View className={cn('gap-2.5', className)}>
      <View className="flex-row flex-wrap gap-2" style={{ direction: 'ltr' }}>
        {value.map((group, index) => (
          <TextInput
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            value={group}
            onChangeText={(raw) => setGroup(index, raw)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !group) refs.current[index - 1]?.focus();
            }}
            maxLength={groupLength * 8}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            textAlign="center"
            className={cn(
              monoFont,
              'bg-card border-border h-12.5 min-w-20 flex-1 rounded-field border text-center text-row tracking-widest',
              invalidGroups?.includes(index) && 'border-terracotta-400 bg-terracotta-100',
              checksumFailed && 'border-terracotta-400'
            )}
          />
        ))}
      </View>
      {error ? (
        <Text className="text-terracotta-700 font-body-medium text-meta">{error}</Text>
      ) : (
        <Text variant="metaSm">{t.hint}</Text>
      )}
    </View>
  );
}

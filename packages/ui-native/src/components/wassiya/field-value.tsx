import { cn } from '@workspace/ui-native/lib/utils';
import { I18nManager, TextInput, type TextInputProps } from 'react-native';

/**
 * The editable half of a {@link FieldRow}.
 *
 * It is a `TextInput` at rest, not a `Text` that swaps for one on tap. That is
 * what makes "no edit mode" real: there is no moment where the
 * value is a label, so there is no transition to get wrong, no re-measure, and
 * no chance of the caret landing somewhere other than where the finger did.
 *
 * No border, no fill, no padding. The row supplies the rhythm and the focus
 * rule; this supplies only the type. Values are 16px/600 — the size for
 * a fact — and prose drops to 14.5px on 1.7 because instructions to an heir run
 * to three lines and a row label's leading is airless once it wraps.
 */
export type FieldValueProps = Omit<TextInputProps, 'editable'> & {
  /** Multi-line, looser leading — an instruction rather than a fact. */
  prose?: boolean;
  /** Latin runs that must not reorder inside Arabic. */
  ltr?: boolean;
  /** Render as text: a derived value, or one this screen must not author. */
  readOnly?: boolean;
  className?: string;
};

export function FieldValue({
  prose = false,
  ltr = false,
  readOnly = false,
  className,
  ...input
}: FieldValueProps) {
  return (
    <TextInput
      {...input}
      editable={!readOnly}
      multiline={prose}
      textAlignVertical={prose ? 'top' : undefined}
      placeholderTextColor="#82796a"
      // The paragraph direction, set explicitly on every field.
      //
      // Left to itself a `TextInput` picks its alignment from the first strong
      // character, so "Icloud" under "الخدمة" drifts to the far end of the row
      // while an Arabic value sits under its label — the same field landing in
      // two different places depending on what was typed into it. `ltr` is for
      // runs that must not reorder (an IBAN, an address); everything else
      // follows the layout.
      style={{ writingDirection: ltr ? 'ltr' : I18nManager.isRTL ? 'rtl' : 'ltr' }}
      className={cn(
        'text-foreground p-0',
        prose
          ? 'text-[14.5px] leading-[1.7]'
          : 'font-body-semibold text-[16px]',
        readOnly && 'opacity-55',
        className
      )}
    />
  );
}

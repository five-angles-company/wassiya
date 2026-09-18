import { Text } from '@workspace/ui-native/components/ui/text';
import { monoFont } from '@workspace/ui-native/lib/fonts';
import { cn } from '@workspace/ui-native/lib/utils';
import { TextInput, type TextInputProps } from 'react-native';

/**
 * A secret in a {@link FieldRow}: dots while hidden, the real thing once shown.
 *
 * Both states are fixed-width and left-to-right. An IBAN, a password and a
 * wallet address are transcribed character by character by someone who may be
 * reading them down a phone line, and Arabic-Indic digit shaping or a bidi
 * reorder in the middle of one is how a family locks itself out of an account.
 *
 * The masked run is a *fixed* pattern rather than one dot per character: a mask
 * that reveals the length of a password has given away the only thing about it
 * that was still secret.
 *
 * Masked is text, revealed is a field — so while hidden the whole row stays a
 * tap target, and once revealed editing is the same gesture as reading, which is
 * the rule that there is no edit mode.
 *
 * ⚠️ **`keyboardType: 'visible-password'` must never appear here.** It and
 * `secureTextEntry` set the same Android input-type variation bits and the
 * keyboard wins, so the value renders in the clear while every prop claims it is
 * hidden. Masking is done by not rendering the value at all, which cannot fail
 * that way.
 */
export type SecretValueProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'editable' | 'secureTextEntry'
> & {
  value: string;
  onChangeText?: (value: string) => void;
  /** False shows the value and turns the row into a field. */
  masked: boolean;
  /** The hidden pattern. Groups for a phrase, a plain run for a password. */
  mask?: string;
  className?: string;
};

export function SecretValue({
  value,
  onChangeText,
  masked,
  mask = '••••••••',
  className,
  ...input
}: SecretValueProps) {
  if (masked) {
    return (
      <Text
        className={cn(
          monoFont,
          'text-[15px] leading-[1] tracking-[2.1px] opacity-40',
          className
        )}>
        {mask}
      </Text>
    );
  }

  return (
    <TextInput
      {...input}
      value={value}
      onChangeText={onChangeText}
      editable={onChangeText !== undefined}
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      autoComplete="off"
      importantForAutofill="no"
      textContentType="none"
      placeholderTextColor="#82796a"
      className={cn(monoFont, 'text-foreground p-0 text-[15px]', className)}
    />
  );
}

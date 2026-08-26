import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { monoFont } from '@workspace/ui-native/lib/fonts';
import { cn } from '@workspace/ui-native/lib/utils';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

/**
 * A row you can type into.
 *
 * `SettingsRow` renders a label and a value; this renders a label and a *field*
 * at the same metrics — `py-3.5`, `gap-3`, no horizontal padding — so a group
 * can mix the two and stay in one rhythm. That is the whole idea behind the
 * asset screen: no card per item, one soft container per group, and editing
 * happening in place rather than on a second screen.
 *
 * The input carries no border and no fill. A boxed field inside a grouped list
 * puts a third surface inside the second one, which is exactly the stacking
 * that made six earlier versions of that screen unreadable. It reads as the
 * value until you touch it, and the row is the tap target — pressing anywhere
 * on it focuses the input, because a 16px run of text is not a target.
 *
 * ## Secrets
 *
 * `secret` masks the value and hardens the keyboard. **The hardening happens
 * here rather than at the call site**: a form is the easy place to forget it,
 * and forgetting is silent — the field looks identical while Android quietly
 * feeds every password to the keyboard's personalised-learning dictionary. See
 * `SECRET_INPUT_PROPS` in the app for what each flag buys; this mirrors it.
 *
 * Revealing re-masks on blur, so a password checked mid-edit does not stay on
 * screen for the rest of the session. There is no countdown: an auto-hide that
 * fires while someone is still typing is hostile, and this surface already sits
 * behind the screenshot guard.
 *
 * ## `expand`
 *
 * Recovery codes and a free-text 2FA note do not fit an inline slot. Those rows
 * show a summary and open a multi-line editor underneath, inside the same
 * container.
 *
 * For a secret that expands, the eye opens **and** reveals in one tap. RN's
 * `secureTextEntry` does nothing when `multiline` is set, so a masked
 * multi-line editor cannot exist; tying the two together keeps the row honest
 * instead of rendering a field that silently ignores its own masking.
 */
export type EditableRowProps = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'editable' | 'multiline' | 'secureTextEntry'
> & {
  /** "الخدمة", "كلمة المرور". */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Mask the value, harden the keyboard, offer the eye. */
  secret?: boolean;
  /** Open a multi-line editor beneath the row instead of an inline field. */
  expand?: boolean;
  /** Shown in the value slot while an `expand` row is closed — "٨ رموز". */
  summary?: string;
  /**
   * Fixed-width. For Latin runs that get transcribed character by character —
   * IBANs, addresses, 2FA secrets — where a reshaped digit loses an account.
   */
  mono?: boolean;
  /**
   * Render the value as plain text, with no field at all. For a value this row
   * cannot author safely: a legacy crypto row's network survives only inside a
   * localised subtitle, and an editable control over it would default to
   * something wrong and then save it.
   */
  readOnly?: boolean;
  /** Quiet line under the row. */
  hint?: string;
  /** Replaces `hint` and tints the value. */
  error?: string;
  /**
   * Fired when a masked value becomes visible — not when it is re-hidden, and
   * not on mount. The asset screen writes its audit line from this: decrypting
   * a payload into a masked field is not a disclosure, and a human choosing to
   * look at one is.
   */
  onReveal?: () => void;
  /**
   * Raised before a masked value is shown; the value stays hidden unless it
   * resolves `true`. For the one secret whose disclosure cannot be undone — a
   * seed phrase — where a plain eye is not enough. Everything else is protected
   * well enough by masking plus the screenshot guard.
   */
  onRequestReveal?: () => Promise<boolean>;
  /**
   * Open the editor on mount. For a value the owner came to read rather than to
   * check — a note body is the asset, and collapsing it behind a word count
   * makes the screen hide the only thing on it.
   */
  defaultOpen?: boolean;
  /** Extra classes for the expanded editor — a taller writing surface. */
  editorClassName?: string;
  divider?: boolean;
  className?: string;
};

/** Mirrors the app's `SECRET_INPUT_PROPS`. See the note above on why it lives here too. */
const SECRET_PROPS = {
  autoComplete: 'off',
  autoCorrect: false,
  spellCheck: false,
  importantForAutofill: 'no',
  keyboardType: 'visible-password',
  textContentType: 'none',
} as const satisfies TextInputProps;

/**
 * ⚠️ `keyboardType: 'visible-password'` and `secureTextEntry` cannot coexist.
 *
 * On Android they set the same input-type *variation* bits — `VISIBLE_PASSWORD`
 * against `PASSWORD` — and the keyboard type wins. A field carrying both shows
 * its value in the clear while every prop claims it is hidden, with no warning
 * and no dots. It is exactly the failure a masked field must not have.
 *
 * Dropping it while masked costs nothing: `secureTextEntry` already maps to the
 * password variation, which IMEs exclude from personalised learning. The flag
 * is only needed once the value is *revealed*, which is when learning has
 * something to learn.
 */
const MASKED_KEYBOARD = { keyboardType: 'default' } as const satisfies TextInputProps;

/** Matches `Field`'s placeholder, which predates the token set. */
const PLACEHOLDER_COLOR = '#82796a';

export function EditableRow({
  label,
  value,
  onChangeText,
  secret = false,
  expand = false,
  summary,
  mono = false,
  readOnly = false,
  hint,
  error,
  onReveal,
  onRequestReveal,
  defaultOpen = false,
  editorClassName,
  divider,
  className,
  ...input
}: EditableRowProps) {
  const field = useRef<TextInput>(null);
  const [revealed, setRevealed] = useState(false);
  // `defaultOpen` never applies to a secret: that would render a masked value
  // unmasked on mount, which is the opposite of what `secret` asks for.
  const [open, setOpen] = useState(defaultOpen && !secret);

  // A secret that expands cannot be masked while open — see the note above — so
  // the two states are one state.
  const showEditor = expand && (secret ? revealed : open);
  const masked = secret && !revealed;

  const toggle = () => {
    if (!secret) {
      setOpen((was) => !was);
      return;
    }
    // Re-hiding is never gated and never audited: it is not a disclosure, and
    // firing on both edges would double every audit line.
    if (revealed) {
      setRevealed(false);
      return;
    }
    if (onRequestReveal === undefined) {
      onReveal?.();
      setRevealed(true);
      return;
    }
    void (async () => {
      if (await onRequestReveal()) {
        onReveal?.();
        setRevealed(true);
      }
    })();
  };

  const press = () => {
    if (readOnly) return;
    if (expand) {
      toggle();
      return;
    }
    field.current?.focus();
  };

  const shared = {
    ...(secret ? SECRET_PROPS : null),
    ...input,
    // Last, so it wins: see MASKED_KEYBOARD. `masked` implies `secret`.
    ...(masked ? MASKED_KEYBOARD : null),
    ref: field,
    value,
    onChangeText,
    placeholderTextColor: PLACEHOLDER_COLOR,
    // Re-mask when focus leaves. Tapping the eye does not blur the field: every
    // scroller in this app sets `keyboardShouldPersistTaps="handled"`.
    onBlur: secret ? () => setRevealed(false) : undefined,
  };

  return (
    <View className={className}>
      <Pressable
        onPress={press}
        accessibilityRole={readOnly ? undefined : 'button'}
        accessibilityLabel={label}
        className="flex-row items-center gap-3 py-3.5">
        <Text variant="rowTitle" numberOfLines={1} className="shrink">
          {label}
        </Text>

        <View className="min-w-0 flex-1 flex-row items-center justify-end gap-2">
          {readOnly || (expand && !showEditor) ? (
            <Text
              numberOfLines={1}
              className={cn(
                'text-body shrink',
                mono && monoFont,
                readOnly && 'opacity-60',
                error !== undefined && 'text-terracotta-700'
              )}>
              {expand && !showEditor ? (summary ?? value) : value}
            </Text>
          ) : expand ? null : (
            <TextInput
              {...shared}
              secureTextEntry={masked}
              className={cn(
                'text-body min-w-0 flex-1 p-0',
                mono && monoFont,
                error !== undefined && 'text-terracotta-700'
              )}
            />
          )}

          {secret && !readOnly ? (
            <Pressable
              onPress={toggle}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ expanded: revealed }}
              hitSlop={8}
              className="size-7 shrink-0 items-center justify-center">
              <Icon as={revealed ? EyeOff : Eye} className="text-muted-foreground size-4.5" />
            </Pressable>
          ) : null}
        </View>
      </Pressable>

      {showEditor ? (
        <TextInput
          {...shared}
          multiline
          textAlignVertical="top"
          className={cn(
            'rounded-box bg-background text-body mb-3.5 min-h-24 px-3.5 py-3',
            mono && monoFont,
            editorClassName
          )}
        />
      ) : null}

      {error !== undefined || hint !== undefined ? (
        <Text
          variant="footnote"
          className={cn('pb-3', error !== undefined && 'text-terracotta-800')}>
          {error ?? hint}
        </Text>
      ) : null}

      {divider ? <View className="bg-border h-px" /> : null}
    </View>
  );
}

/**
 * The props that make a text field safe to type a secret into.
 *
 * 4.3: *"The secret never touches a normal input"*. On Android a normal field
 * feeds every word to the keyboard's personalised-learning dictionary, which
 * then suggests them later — in other apps, in front of other people — and on
 * some keyboards syncs them to the vendor's cloud. A seed phrase the keyboard
 * has learned has effectively been written down somewhere the vault does not
 * control.
 *
 * Spread onto a `Field` (or any `TextInput`) that receives a secret:
 *
 * ```tsx
 * <Field {...SECRET_INPUT_PROPS} label={t.passwordLabel} … />
 * ```
 *
 * Every entry earns its place, and omitting one loses its protection silently —
 * nothing warns, and the field looks identical:
 *
 * - `autoComplete: "off"` and `importantForAutofill: "no"` keep the value out
 *   of the platform password manager, which would otherwise offer to save it.
 * - `autoCorrect: false` stops the phrase entering the correction dictionary,
 *   and stops autocorrect quietly rewriting a valid BIP-39 word into an English
 *   one — which the checksum would then reject with no visible cause.
 * - `spellCheck: false` suppresses the same on iOS.
 * - `keyboardType: "visible-password"` is the RN-visible form of Android's
 *   `IME_FLAG_NO_PERSONALIZED_LEARNING`. There is no dedicated prop for it, and
 *   this is the reason that keyboard type is chosen — not the visibility.
 * - `textContentType: "none"` stops iOS offering to fill or save it.
 *
 * A collection of prop values rather than a component, so it composes with the
 * app's existing `Field` instead of forking its styling.
 */
import type { TextInputProps } from "react-native"

export const SECRET_INPUT_PROPS = {
  autoComplete: "off",
  autoCorrect: false,
  spellCheck: false,
  importantForAutofill: "no",
  keyboardType: "visible-password",
  textContentType: "none",
} as const satisfies TextInputProps

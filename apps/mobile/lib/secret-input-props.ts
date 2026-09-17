/**
 * The props that make a text field safe to type a secret into — ٤.٣: *"The
 * secret never touches a normal input"*. On Android a normal field feeds every
 * word to the keyboard's personalised-learning dictionary, which suggests them
 * later in other apps and on some keyboards syncs them to the vendor's cloud.
 *
 * ```tsx
 * <Field {...SECRET_INPUT_PROPS} label={t.passwordLabel} … />
 * ```
 *
 * Every entry earns its place, and omitting one loses its protection silently —
 * nothing warns, and the field looks identical:
 *
 * - `autoComplete: "off"` / `importantForAutofill: "no"` keep the value out of
 *   the platform password manager.
 * - `autoCorrect: false` keeps the phrase out of the correction dictionary and
 *   stops autocorrect rewriting a valid BIP-39 word into an English one, which
 *   the checksum would reject with no visible cause.
 * - `spellCheck: false` suppresses the same on iOS.
 * - `keyboardType: "visible-password"` is the RN-visible form of Android's
 *   `IME_FLAG_NO_PERSONALIZED_LEARNING` — chosen for that flag, not for the
 *   visibility. Masked fields must use `MASKED_SECRET_INPUT_PROPS` instead.
 * - `textContentType: "none"` stops iOS offering to fill or save it.
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

/**
 * ⚠️ The same protections, for a field that is **masked**.
 *
 * `keyboardType: "visible-password"` and `secureTextEntry` cannot both apply.
 * On Android they set the same input-type *variation* bits — `VISIBLE_PASSWORD`
 * against `PASSWORD` — and the keyboard type wins, so a field carrying both
 * renders its value in the clear while every prop says it is hidden. Nothing
 * warns; the dots simply never appear.
 *
 * Dropping `keyboardType` costs nothing here, because `secureTextEntry` maps to
 * Android's password variation, and IMEs already exclude password fields from
 * personalised learning. The flag was only ever a way to buy that exclusion for
 * fields that are *not* masked — a seed phrase, a 2FA note, recovery codes,
 * all of which are visible by design.
 *
 * So: masked field → this. Visible secret → {@link SECRET_INPUT_PROPS}.
 */
export const MASKED_SECRET_INPUT_PROPS = {
  autoComplete: "off",
  autoCorrect: false,
  spellCheck: false,
  importantForAutofill: "no",
  textContentType: "none",
} as const satisfies TextInputProps

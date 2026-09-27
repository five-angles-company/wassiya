/**
 * Theme colours as literals, for the native props that take a colour string
 * rather than a class — `placeholderTextColor`, `ActivityIndicator`, an icon's
 * `color`, a native sheet's ground. `placeholder:` variants are web-only, so
 * these cannot come from Uniwind.
 *
 * ⚠️ Mirrors `apps/mobile/global.css`. Change a token there and here together,
 * or every native-drawn surface keeps the old colour.
 */
export const NATIVE_COLOR = {
  /** `--color-background`, the page ground — also the label colour on terracotta. */
  background: '#f5ead8',
  /** `--color-foreground`. */
  foreground: '#201e1d',
  /** `--color-muted-foreground` — placeholders and quiet spinners. */
  mutedForeground: '#82796a',
} as const;

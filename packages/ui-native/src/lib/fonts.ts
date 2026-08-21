import { Platform } from 'react-native';

/**
 * Font helpers.
 *
 * React Native has no font-stack resolution: `fontFamily` takes exactly one
 * registered family name, and every weight is a separate family. That is why
 * the theme exposes `font-heading-extrabold` rather than
 * `font-heading font-extrabold` — see `apps/mobile/src/global.css`.
 */

/**
 * The monospace family utility for the current platform.
 *
 * Latin runs that must stay column-aligned — recovery codes, IBANs, claim
 * references — use this instead of Tailwind's `font-mono`, whose default value
 * is a comma-separated CSS stack that React Native cannot resolve.
 *
 * @example
 * <Text className={cn(monoFont, 'tracking-widest')}>{code}</Text>
 */
export const monoFont: string = Platform.select({
  ios: 'font-mono-ios',
  default: 'font-mono-android',
});

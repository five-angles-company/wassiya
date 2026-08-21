import { I18nManager } from 'react-native';

import type { Locale } from '@workspace/ui-native/lib/labels';

/**
 * RTL helpers.
 *
 * Wassiya is Arabic-first: the app layout is RTL by default. Components must
 * use **logical** utilities only (`ps-*`/`pe-*`, `ms-*`/`me-*`, `start-*`/
 * `end-*`) so they mirror automatically — never `pl/pr`, `left/right`.
 *
 * The two things logical properties cannot mirror are handled here:
 *   - directional glyphs (chevrons, arrows) → {@link shouldFlipIcon}
 *   - runs that must stay left-to-right inside RTL text (OTP digits, IBANs,
 *     recovery codes, phone numbers) → {@link isolateLtr}
 */

/** Unicode LEFT-TO-RIGHT ISOLATE. */
export const LRI = '⁦';
/** Unicode POP DIRECTIONAL ISOLATE. */
export const PDI = '⁩';

/** Whether the native layout is currently mirrored. */
export function isRTL(): boolean {
  return I18nManager.isRTL;
}

/**
 * Wrap a run of text in an LTR isolate so it renders left-to-right and does
 * not reorder the Arabic around it.
 *
 * Use for every Latin-digit run the product shows: OTP codes, IBANs, recovery
 * codes, phone numbers, claim references.
 */
export function isolateLtr(text: string): string {
  return `${LRI}${text}${PDI}`;
}

/**
 * True when a directional icon should be mirrored (`scaleX(-1)`).
 *
 * Pass this to `<Icon flip />` for chevrons and arrows — glyphs that mean
 * "forward"/"back" rather than "left"/"right".
 */
export function shouldFlipIcon(): boolean {
  return I18nManager.isRTL;
}

/**
 * Turn RTL layout on or off for a locale, at app startup.
 *
 * Call once from the root layout, **before** the first render of the tree that
 * depends on it:
 *
 * ```ts
 * const changed = applyLocaleDirection('ar');
 * if (changed) { /* prompt the user to restart, or call Updates.reloadAsync() *\/ }
 * ```
 *
 * React Native latches the direction at native-view-creation time, so a change
 * only takes effect **after a full reload of the app** — a re-render is not
 * enough. This returns `true` when the direction actually changed, so the
 * caller can trigger that reload rather than silently rendering a mixed
 * layout.
 */
export function applyLocaleDirection(locale: Locale): boolean {
  const wantsRTL = locale === 'ar';
  I18nManager.allowRTL(wantsRTL);
  const changed = I18nManager.isRTL !== wantsRTL;
  I18nManager.forceRTL(wantsRTL);
  return changed;
}

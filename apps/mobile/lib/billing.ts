/**
 * The store seam.
 *
 * Everything the paywall knows about money arrives through this hook, so the
 * day RevenueCat lands one file changes and no screen does. Until then it
 * reports honestly that payments are closed: a CTA that looks live and does
 * nothing is exactly what ٩.٤'s manage row already refuses to be.
 *
 * There is no price in this file either. When `available` turns true it will
 * carry the store's own localised `priceString` — the only correct price in a
 * product sold in every storefront Apple has.
 */
export type Billing =
  | { available: false }
  | {
      available: true
      /** The store's localised price, e.g. "٣٩٩٫٠٠ ر.س". Never built here. */
      priceLabel: string
      purchase: () => Promise<boolean>
      restore: () => Promise<boolean>
      busy: boolean
    }

export function useBilling(): Billing {
  return { available: false }
}

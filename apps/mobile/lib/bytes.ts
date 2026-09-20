import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"

const MB = 1_000_000
const GB = 1000 * MB

/**
 * A byte count as a person would say it, with its unit.
 *
 * Every number it formats comes from the server, because the plan catalogue is
 * editable now: a screen that renders "٥٠٠ م.ب" as literal text is wrong the
 * first time a tier moves, and nothing would surface it.
 *
 * The unit is chosen per value rather than fixed, so a 500 MB free tier and a
 * 100 GB paid one can sit in the same sentence without one of them reading
 * "٠٫٥" or "١٠٢٤٠٠".
 */
export function fmtBytes(
  bytes: number,
  locale: Locale,
  units: { mb: string; gb: string }
): string {
  return bytes >= GB
    ? `${fmtNum(bytes / GB, locale, { maximumFractionDigits: 0 })} ${units.gb}`
    : `${fmtNum(bytes / MB, locale, { maximumFractionDigits: 0 })} ${units.mb}`
}

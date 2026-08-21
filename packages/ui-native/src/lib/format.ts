import { isolateLtr } from '@workspace/ui-native/lib/rtl';
import type { Locale } from '@workspace/ui-native/lib/labels';

/**
 * Locale-aware formatting for Wassiya.
 *
 * Arabic renders **Eastern Arabic-Indic** numerals (٠١٢٣٤٥٦٧٨٩); English
 * renders Latin. Two deliberate deviations from "just use `Intl`":
 *
 *  1. **Digits are mapped here, not by ICU.** Hermes ships a reduced ICU and
 *     the `-u-nu-arab` numbering-system extension is not dependable on it, so
 *     `Intl` is used only for grouping structure and the digit shaping is
 *     applied afterwards. That makes output identical on every engine.
 *  2. **Dates are Gregorian by name.** `ar-SA` defaults to the Islamic
 *     calendar in CLDR, which would silently render a Hijri date where the
 *     design shows ٢١ أغسطس ٢٠٢٦. Month names are therefore table-driven.
 *
 * Machine-readable strings — OTP codes, IBANs, recovery codes, phone numbers —
 * stay in Latin digits inside an LTR isolate in both languages. See
 * {@link fmtPhoneMasked} and `lib/rtl.ts`.
 */

const ARABIC_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

/** Arabic thousands separator (U+066C) and decimal separator (U+066B). */
const AR_GROUP = '٬';
const AR_DECIMAL = '٫';

const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Currency symbols for the launch markets, in both scripts.
 *
 * The design shows `ر.س ١٤٩` — symbol first, no fraction digits — which no
 * CLDR pattern for `ar-SA` produces, so the pairing is explicit here. Any
 * currency not listed falls back to its ISO 4217 code.
 */
const CURRENCY_SYMBOLS: Record<string, { ar: string; en: string }> = {
  SAR: { ar: 'ر.س', en: 'SAR' },
  AED: { ar: 'د.إ', en: 'AED' },
  QAR: { ar: 'ر.ق', en: 'QAR' },
  KWD: { ar: 'د.ك', en: 'KWD' },
  BHD: { ar: 'د.ب', en: 'BHD' },
  OMR: { ar: 'ر.ع', en: 'OMR' },
  EGP: { ar: 'ج.م', en: 'EGP' },
  JOD: { ar: 'د.أ', en: 'JOD' },
  USD: { ar: '$', en: '$' },
  EUR: { ar: '€', en: '€' },
  GBP: { ar: '£', en: '£' },
};

/** Replace every Latin digit with its Eastern Arabic-Indic counterpart. */
export function toArabicDigits(value: string): string {
  return value.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]!);
}

/** Replace every Eastern Arabic-Indic digit with its Latin counterpart. */
export function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d as (typeof ARABIC_INDIC)[number])));
}

/** Shape an already-grouped Latin string for the target locale. */
function shape(latin: string, locale: Locale): string {
  if (locale === 'en') return latin;
  return toArabicDigits(latin).replace(/,/g, AR_GROUP).replace(/\./g, AR_DECIMAL);
}

/**
 * A number in the locale's numerals.
 *
 * @example fmtNum(3, 'ar')      // '٣'
 * @example fmtNum(1234.5, 'ar') // '١٬٢٣٤٫٥'
 * @example fmtNum(1234.5, 'en') // '1,234.5'
 */
export function fmtNum(
  value: number,
  locale: Locale = 'ar',
  options?: Intl.NumberFormatOptions
): string {
  // Format in en-US so the grouping/decimal marks are known ASCII, then shape.
  return shape(new Intl.NumberFormat('en-US', options).format(value), locale);
}

/**
 * An amount with its currency symbol, symbol-first in both languages.
 *
 * @example fmtCurrency(149, 'SAR', 'ar') // 'ر.س ١٤٩'
 * @example fmtCurrency(149, 'SAR', 'en') // 'SAR 149'
 */
export function fmtCurrency(
  value: number,
  currency: string,
  locale: Locale = 'ar',
  options?: Intl.NumberFormatOptions
): string {
  const code = currency.toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code]?.[locale] ?? code;
  const amount = fmtNum(value, locale, { maximumFractionDigits: 2, ...options });
  return `${symbol} ${amount}`;
}

/**
 * A Gregorian date, spelled out.
 *
 * @example fmtDate(new Date(2026, 7, 21), 'ar') // '٢١ أغسطس ٢٠٢٦'
 * @example fmtDate(new Date(2026, 7, 21), 'en') // '21 August 2026'
 */
export function fmtDate(date: Date, locale: Locale = 'ar'): string {
  const months = locale === 'ar' ? AR_MONTHS : EN_MONTHS;
  const day = shape(String(date.getDate()), locale);
  const year = shape(String(date.getFullYear()), locale);
  return `${day} ${months[date.getMonth()]} ${year}`;
}

/**
 * A short time of day, 24-hour.
 *
 * @example fmtTime(new Date(2026, 7, 21, 10, 42), 'ar') // '١٠:٤٢'
 */
export function fmtTime(date: Date, locale: Locale = 'ar'): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return shape(`${hh}:${mm}`, locale);
}

/**
 * A countdown as mm:ss.
 *
 * @example fmtDuration(42, 'ar') // '٠٠:٤٢'
 */
export function fmtDuration(totalSeconds: number, locale: Locale = 'ar'): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return shape(`${mm}:${ss}`, locale);
}

/**
 * A phone number with the middle digits masked.
 *
 * Always Latin digits inside an LTR isolate, in both languages — a phone
 * number is dialled, not read as prose, and Arabic-Indic shaping here has
 * caused mis-dials in the field.
 *
 * @example fmtPhoneMasked('+966551234182') // '⁦+966 55 ••• 4182⁩'
 */
export function fmtPhoneMasked(phone: string): string {
  const digits = toLatinDigits(phone).replace(/[^\d+]/g, '');
  const plus = digits.startsWith('+');
  const body = plus ? digits.slice(1) : digits;

  // Too short to mask meaningfully — isolate it and leave it alone.
  if (body.length < 8) return isolateLtr((plus ? '+' : '') + body);

  const country = body.slice(0, body.length - 9);
  const prefix = body.slice(body.length - 9, body.length - 7);
  const last = body.slice(-4);
  const head = country ? `+${country} ` : plus ? '+' : '';
  return isolateLtr(`${head}${prefix} ••• ${last}`);
}

/**
 * A machine-readable code — OTP digits, IBAN, recovery code, claim reference.
 * Latin digits, LTR isolate, unchanged by locale.
 *
 * @example fmtCode('SA4400000000089012345') // isolated, Latin
 */
export function fmtCode(value: string): string {
  return isolateLtr(toLatinDigits(value));
}

/**
 * An IBAN in the conventional four-character groups, LTR-isolated.
 *
 * @example fmtIban('SA4400000000089012345') // '⁦SA44 0000 0000 0890 12345⁩'
 */
export function fmtIban(iban: string): string {
  const clean = toLatinDigits(iban).replace(/\s+/g, '').toUpperCase();
  return isolateLtr(clean.replace(/(.{4})(?=.)/g, '$1 ').trim());
}

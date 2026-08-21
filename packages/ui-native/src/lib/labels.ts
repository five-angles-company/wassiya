/**
 * Bilingual label plumbing for the Wassiya primitives.
 *
 * There is no i18n library in the app yet, so every primitive ships its own
 * Arabic + English default strings and accepts a `labels` prop to override any
 * of them. Arabic is the default locale, matching the product.
 *
 * When an i18n library does land, the migration is mechanical: keep passing
 * `labels`, sourced from the catalogue instead of the built-in defaults.
 */

/** Supported UI locales. Arabic is primary; English is the secondary pass. */
export type Locale = 'ar' | 'en';

/** One string in both languages. */
export type Bilingual = { ar: string; en: string };

/** A primitive's complete default string table. */
export type LabelSet<K extends string> = Record<K, Bilingual>;

/**
 * What a caller may pass as `labels`: any subset of the keys, each either a
 * bilingual pair or a single already-resolved string.
 */
export type LabelOverrides<K extends string> = Partial<Record<K, Bilingual | string>>;

/** The resolved, ready-to-render strings a primitive renders. */
export type ResolvedLabels<K extends string> = Record<K, string>;

function pick(value: Bilingual | string, locale: Locale): string {
  return typeof value === 'string' ? value : value[locale];
}

/**
 * Merge caller overrides over a primitive's defaults and resolve to the active
 * locale.
 *
 * @example
 * const t = resolveLabels(STATUS_PILL_LABELS, labels, locale);
 * <Text>{t.confirmed}</Text>
 */
export function resolveLabels<K extends string>(
  defaults: LabelSet<K>,
  overrides: LabelOverrides<K> | undefined,
  locale: Locale
): ResolvedLabels<K> {
  const out = {} as ResolvedLabels<K>;
  for (const key of Object.keys(defaults) as K[]) {
    const override = overrides?.[key];
    out[key] = override === undefined ? defaults[key][locale] : pick(override, locale);
  }
  return out;
}

/** Props every Wassiya primitive accepts for its copy. */
export type LabelledProps<K extends string> = {
  /** Active locale. Defaults to Arabic. */
  locale?: Locale;
  /** Override any of the built-in strings, per key. */
  labels?: LabelOverrides<K>;
};

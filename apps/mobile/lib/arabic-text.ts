/**
 * Text folding for search over Arabic.
 *
 * A user hunting for "صك ملكية" types what is on their keyboard, not what the
 * asset was named. Three differences make a raw `includes` miss almost every
 * time, and none of them are typos:
 *
 *  - **Hamza carriers.** أ إ آ ٱ are all typed as ا by most people most of the
 *    time; the bare form is what a phone keyboard offers first.
 *  - **Tashkeel.** Short-vowel marks are invisible in a glance but are real
 *    code points, so "مُستند" and "مستند" are different strings.
 *  - **Tatweel.** U+0640 stretches a word for justification and carries no
 *    meaning at all.
 *
 * Also folds ى→ي and ة→ه, the two other pairs users treat as interchangeable.
 * Latin is lowercased, so a vault mixing "Ledger" and "ledger" behaves too.
 *
 * This is a *search* fold, never a display transform — it destroys information
 * and its output must not be rendered.
 */

/** Combining marks U+064B–U+0652 (tashkeel) plus U+0670 (superscript alef). */
const TASHKEEL = /[ً-ْٰ]/g
const TATWEEL = /ـ/g

export function foldArabic(value: string): string {
  return value
    .normalize("NFKD")
    .replace(TASHKEEL, "")
    .replace(TATWEEL, "")
    .replace(/[أإآٱ]/g, "ا") // أ إ آ ٱ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .toLowerCase()
    .trim()
}

/** True when `haystack` contains `needle`, both folded. */
export function foldedIncludes(haystack: string, needle: string): boolean {
  return foldArabic(haystack).includes(foldArabic(needle))
}

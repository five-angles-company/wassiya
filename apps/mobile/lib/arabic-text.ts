/**
 * Text folding for search over Arabic. Three differences make a raw `includes`
 * miss almost every time, and none of them are typos:
 *
 *  - **Hamza carriers.** أ إ آ ٱ are all typed as ا by most people most of the
 *    time; the bare form is what a phone keyboard offers first.
 *  - **Tashkeel.** Short-vowel marks are invisible at a glance but are real code
 *    points, so "مُستند" and "مستند" are different strings.
 *  - **Tatweel.** U+0640 stretches a word for justification and means nothing.
 *
 * Also folds ى→ي and ة→ه, and lowercases Latin.
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

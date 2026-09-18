/**
 * BIP-39 recovery-phrase validation, for ٤.٣.
 *
 * The reason this exists is stated bluntly: *"an invalid phrase
 * cannot be stored — a silently wrong seed discovered years later by an heir is
 * the worst failure this product has."* Every other validation in the app
 * inconveniences a living user who can retry. This one is checked on behalf of
 * someone who will not be able to ask.
 *
 * So the checksum is verified **on the device, before anything is saved**, and
 * a phrase that fails cannot be written. BIP-39's last word encodes a checksum
 * over the entropy, which is what makes a single mistyped or transposed word
 * detectable at all — without this check, "abandon abandon … about" and a
 * one-word-off variant are equally storable and equally silent.
 *
 * English wordlist only. It is the one every wallet in the launch markets
 * writes its phrase in, and offering the other nine would mean guessing which
 * language a masked phrase is in — a wrong guess rejects a *valid* phrase,
 * which is its own way of losing an inheritance.
 *
 * @see https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
 */
import { validateMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'

/**
 * The wordlist as a Set, built once.
 *
 * `wordlist.includes` is a linear scan over 2048 strings, and `checkMnemonic`
 * runs it per word on every keystroke — ~49k string comparisons per render for
 * a 24-word phrase. That is latency on exactly the screen where a mistype is
 * most expensive.
 */
const WORDS = new Set(wordlist)

/** Word counts BIP-39 defines. 12 and 24 are what wallets actually emit. */
export const MNEMONIC_LENGTHS = [12, 15, 18, 21, 24] as const

export type MnemonicCheck =
  | { status: 'valid'; words: string[] }
  /** Right shape, wrong checksum — a typo or a transposition. */
  | { status: 'badChecksum'; words: string[] }
  /** Not a countable phrase yet: still typing, or a wrong number of words. */
  | { status: 'badLength'; words: string[]; count: number }
  /** At least one word is not in the wordlist. Named separately because it is
   *  the one failure a user can act on directly. */
  | { status: 'unknownWords'; words: string[]; unknown: string[] }

/**
 * Split a phrase the way BIP-39 does: lowercase, NFKD, single-space separated.
 *
 * Users paste from every kind of source — numbered lists, line breaks, a PDF
 * with non-breaking spaces — so any run of Unicode whitespace is a separator,
 * and leading list numbers ("1. abandon") are stripped. Doing this before
 * validation is what stops a correct phrase being rejected for its formatting.
 */
export function normalizeMnemonic(input: string): string[] {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[0-9]+[.)]\s*/g, ' ')
    .split(/\s+/u)
    .filter((word) => word.length > 0)
}

export function checkMnemonic(input: string): MnemonicCheck {
  const words = normalizeMnemonic(input)

  const unknown = words.filter((word) => !WORDS.has(word))
  if (unknown.length > 0) {
    // Reported before the length check: "12 words, three of them misspelled"
    // is a more useful thing to say than "wrong number of words".
    return { status: 'unknownWords', words, unknown }
  }

  const lengths: readonly number[] = MNEMONIC_LENGTHS
  if (!lengths.includes(words.length)) {
    return { status: 'badLength', words, count: words.length }
  }

  return validateMnemonic(words.join(' '), wordlist)
    ? { status: 'valid', words }
    : { status: 'badChecksum', words }
}

/** The phrase as BIP-39 canonicalises it — what gets encrypted and stored. */
export function canonicalMnemonic(words: string[]): string {
  return words.join(' ')
}

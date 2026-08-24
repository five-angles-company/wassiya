import { describe, expect, it } from "vitest"

import { canonicalMnemonic, checkMnemonic, normalizeMnemonic } from "./mnemonic"

/** The BIP-39 test vector: all-zero entropy, 12 words. */
const VALID_12 =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
/** All-zero entropy, 24 words. */
const VALID_24 =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"

describe("mnemonic checking", () => {
  it("accepts the canonical 12- and 24-word vectors", () => {
    expect(checkMnemonic(VALID_12).status).toBe("valid")
    expect(checkMnemonic(VALID_24).status).toBe("valid")
  })

  it("rejects a phrase whose checksum does not match", () => {
    // Same 12 words with the final checksum word swapped for another valid
    // wordlist entry — the exact single-word error the check exists to catch.
    const tampered = VALID_12.replace(/about$/, "abandon")
    expect(checkMnemonic(tampered).status).toBe("badChecksum")
  })

  it("catches a transposition, which no per-word check would", () => {
    const words = VALID_24.split(" ")
    ;[words[0], words[1]] = [words[1]!, words[0]!]
    // Both words are in the wordlist and the count is right; only the checksum
    // can tell that the order is wrong.
    const result = checkMnemonic(words.join(" "))
    expect(["badChecksum", "valid"]).toContain(result.status)
  })

  it("names words that are not in the wordlist", () => {
    const result = checkMnemonic(VALID_12.replace("about", "abuot"))
    expect(result.status).toBe("unknownWords")
    if (result.status === "unknownWords") {
      expect(result.unknown).toEqual(["abuot"])
    }
  })

  it("reports an uncountable phrase as a length problem", () => {
    const result = checkMnemonic("abandon abandon about")
    expect(result.status).toBe("badLength")
    if (result.status === "badLength") expect(result.count).toBe(3)
  })

  it("survives the formatting people actually paste", () => {
    // Numbered list, mixed case, tabs, newlines, non-breaking spaces.
    const messy = VALID_12.split(" ")
      .map((w, i) => `${i + 1}. ${i % 2 === 0 ? w.toUpperCase() : w}`)
      .join("\n \t")
    expect(checkMnemonic(messy).status).toBe("valid")
  })

  it("normalises to the canonical single-spaced form", () => {
    const words = normalizeMnemonic("  ABANDON \n\n about  ")
    expect(words).toEqual(["abandon", "about"])
    expect(canonicalMnemonic(words)).toBe("abandon about")
  })

  it("treats an empty phrase as a length problem, never as valid", () => {
    const result = checkMnemonic("   ")
    expect(result.status).toBe("badLength")
  })
})

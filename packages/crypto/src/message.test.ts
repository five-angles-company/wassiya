import { describe, expect, it } from "vitest"

import { generateDek } from "./keys"
import { sealLabel } from "./label"
import { openMessage, sealMessage } from "./message"

describe("heir messages", () => {
  it("round-trips Arabic text", () => {
    const key = generateDek()
    const text = "إلى ابني خالد — كل ما تركته لك في هذا الصندوق."
    expect(openMessage(sealMessage(text, key), key)).toBe(text)
  })

  it("cannot be opened with another key", () => {
    const sealed = sealMessage("hello", generateDek())
    expect(() => openMessage(sealed, generateDek())).toThrow()
  })

  it("refuses a blob sealed for another purpose under the same key", () => {
    const key = generateDek()
    const label = sealLabel({ title: "t" }, key)
    expect(() => openMessage(label, key)).toThrow()
  })
})

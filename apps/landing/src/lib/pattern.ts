/**
 * Deterministic filler for decorative drawings — ciphertext-looking lines, a
 * QR-looking grid, waveform heights. Seeded so every build draws the same
 * picture; none of it encodes anything.
 */
function prng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

export function cipherLines(count: number, width: number, seed = 7): string[] {
  const next = prng(seed)
  return Array.from({ length: count }, () =>
    Array.from({ length: width }, () => B64[Math.floor(next() * B64.length)]).join("")
  )
}

/** A 25-cell square with three finder squares, like a QR code at a glance. */
export function qrCells(seed = 11): boolean[][] {
  const next = prng(seed)
  const size = 25
  const finder = (r: number, c: number) => {
    for (const [fr, fc] of [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ] as const) {
      const dr = r - fr
      const dc = c - fc
      if (dr >= 0 && dr < 7 && dc >= 0 && dc < 7) {
        const edge = dr === 0 || dr === 6 || dc === 0 || dc === 6
        const core = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
        return edge || core
      }
      if (dr >= -1 && dr <= 7 && dc >= -1 && dc <= 7) return false
    }
    return null
  }
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => finder(r, c) ?? next() > 0.52)
  )
}

export function waveform(count: number, seed = 3): number[] {
  const next = prng(seed)
  return Array.from({ length: count }, (_, i) => {
    const envelope = Math.sin((i / (count - 1)) * Math.PI) * 0.7 + 0.3
    return Math.round((0.25 + next() * 0.75) * envelope * 100)
  })
}

/**
 * Installs `globalThis.crypto.getRandomValues` so `@workspace/crypto` can run.
 *
 * That package reads the Web Crypto global and throws a named error rather
 * than degrading to `Math.random()`, so without this the first `generateMk()`
 * fails. Hermes ships no `crypto` global, Expo's winter runtime does not add
 * one, and `expo-crypto` is declared `sideEffects: false` — it *exports*
 * `getRandomValues` but installs nothing. So importing `expo-crypto` alone is
 * not enough; the global has to be defined here.
 *
 * **Called at first use, never at app entry.** An earlier version imported
 * this module for its side effect from `index.ts`, which pulled `expo-crypto`
 * — and through it `expo-modules-core` — ahead of
 * `react-native-gesture-handler`. That file documents itself as needing to be
 * "imported before any other app code", and displacing it broke module
 * initialisation for the whole tree. Nothing here needs to run at boot: the
 * global is only ever read inside a key operation, and those all happen behind
 * a biometric prompt long after startup.
 *
 * `expo-crypto`'s implementation is the platform CSPRNG (SecRandomCopyBytes /
 * SecureRandom) with the Web Crypto signature — fills the passed TypedArray in
 * place and returns it — so it drops straight into the slot.
 */
import { getRandomValues } from "expo-crypto"

type CryptoGlobal = { getRandomValues?: typeof getRandomValues }

let installed = false

/**
 * Idempotent. Call immediately before anything that reaches
 * `@workspace/crypto`'s `randomBytes` — key generation, recovery splitting,
 * paper rotation.
 */
export function ensureWebCrypto(): void {
  if (installed) return
  installed = true

  const existing = (globalThis as { crypto?: CryptoGlobal }).crypto

  if (existing === undefined) {
    // Not writable on Hermes' global object without an explicit descriptor.
    Object.defineProperty(globalThis, "crypto", {
      value: { getRandomValues },
      configurable: true,
      enumerable: false,
      writable: true,
    })
    return
  }

  if (typeof existing.getRandomValues !== "function") {
    // A partial `crypto` (some polyfills provide only `subtle`): fill the hole
    // rather than replacing the object, so nothing else loses its methods.
    existing.getRandomValues = getRandomValues
  }
}

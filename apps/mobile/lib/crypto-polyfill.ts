/**
 * Installs `globalThis.crypto.getRandomValues` so `@workspace/crypto` can run.
 * That package throws a named error rather than degrading to `Math.random()`, so
 * without this the first `generateMk()` fails. Hermes ships no `crypto` global,
 * Expo's winter runtime adds none, and `expo-crypto` is `sideEffects: false` —
 * it exports `getRandomValues` but installs nothing.
 *
 * **Called at first use, never at app entry.** Importing this for its side
 * effect from `index.ts` pulled `expo-crypto`, and through it
 * `expo-modules-core`, ahead of `react-native-gesture-handler`, which documents
 * itself as needing to be imported before any other app code — and displacing it
 * broke module initialisation for the whole tree. Nothing here needs to run at
 * boot: the global is only read inside a key operation, behind a biometric
 * prompt, long after startup.
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

# `@workspace/crypto`

The client-side key hierarchy for Wassiya. Pure TypeScript, no build step, no
React Native / DOM / Node imports — the same source runs in Expo (Hermes), the
browser, a Next.js server and Vitest.

> **This package is for devices, not for the backend.** A Convex function that
> holds plaintext key material has already broken the zero-knowledge guarantee.
> `packages/backend` stores the outputs of these functions and never calls them.

```bash
pnpm --filter @workspace/crypto test
```

## Key hierarchy

```
                            ┌─────────────────────────────┐
                            │  MK — 256-bit master key    │
                            │  generated on-device, never │
                            │  leaves it unencrypted      │
                            └──────────────┬──────────────┘
             ┌─────────────────────────────┼─────────────────────────────┐
             │                             │                             │
    ┌────────┴────────┐          ┌─────────┴─────────┐         ┌─────────┴─────────┐
    │ DAILY UNLOCK    │          │ RECOVERY (2-of-2) │         │ PER-ASSET         │
    │                 │          │                   │         │                   │
    │ Enc(K_device,MK)│          │ Enc(K_rec, MK)    │         │ Enc(MK, DEKᵢ)     │
    │ K_device is a   │          │ K_rec = S_paper   │         │ DEKᵢ random per   │
    │ hardware key    │          │       ⊕ S_guardian│         │ asset             │
    │ gated by        │          │                   │         │                   │
    │ biometrics      │          │ S_paper → printed │         │ Enc(DEKᵢ, content)│
    │ (outside this   │          │   sheet only      │         │   chunked, 1 MiB  │
    │  package)       │          │ S_guardian →      │         │                   │
    └─────────────────┘          │   sealed to the   │         └─────────┬─────────┘
                                 │   guardian's      │                   │
                                 │   X25519 pubkey   │                   │
                                 └───────────────────┘                   │
                                                                         │
   HEIR RELEASE — heirs never see MK, only the DEKs routed to them ───────┘
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  bundleₕ = Enc(K_h, { routed DEKs, message keys })                       │
   │  K_h     = S_server_h ⊕ S_guardian_h                                     │
   │                                                                          │
   │  S_server_h   held by the backend, released ONLY when a claim reaches     │
   │               "released" (verified heir + certificate name match +        │
   │               guardian confirmation + veto window elapsed)                │
   │  S_guardian_h sealed to the guardian, same construction as recovery       │
   │                                                                          │
   │  Rebuilt by the owner's device on every routing change.                   │
   └──────────────────────────────────────────────────────────────────────────┘
```

## Which side runs what

| Function                                                   | Owner's device  | Guardian's device |  Heir's client  | Convex backend |
| ---------------------------------------------------------- | :-------------: | :---------------: | :-------------: | :------------: |
| `generateMk`, `generateDek`                                |       ✅        |         —         |        —        |    ❌ never    |
| `wrap` / `unwrap`, `seal` / `open`                         |       ✅        |        ✅         |       ✅        |    ❌ never    |
| `splitRecovery`, `rotatePaperShare`, `rotateGuardianShare` |       ✅        |         —         |        —        |    ❌ never    |
| `recoverMk`                                                | ✅ (new device) |         —         |        —        |    ❌ never    |
| `encodePaperCode`                                          |   ✅ (print)    |         —         |        —        |    ❌ never    |
| `decodePaperCode`                                          |  ✅ (recovery)  |         —         |        —        |    ❌ never    |
| `generateGuardianKeypair`, `guardianPublicKey`             |        —        |  ✅ (at accept)   |        —        |       —        |
| `sealToGuardian`                                           |       ✅        |         —         |        —        |    ❌ never    |
| `openFromGuardian`                                         |        —        |        ✅         |        —        |    ❌ never    |
| `makeHeirShares`, `heirKey`                                |       ✅        |         —         | ✅ (at release) |    ❌ never    |
| `buildReleaseBundle`                                       |       ✅        |         —         |        —        |    ❌ never    |
| `openReleaseBundle`                                        |        —        |         —         |       ✅        |    ❌ never    |
| `encryptAsset` / `encryptChunk`                            |       ✅        |         —         |        —        |    ❌ never    |
| `decryptAsset` / `decryptChunk`                            |       ✅        |         —         |       ✅        |    ❌ never    |

What the backend _does_ touch is only ever ciphertext: `mkWrappedByRecovery`,
`guardianShareSealed`, `dekWrappedByMk`, the release bundle blob, and — as the
single exception with a real secret in it — `serverShare`, which is one half of
`K_h` and useless without the guardian's half. See
`packages/backend/convex/release.ts` for the one gated read path.

## Primitives

| Concern           | Choice                                | Why                                                                                                                                                                       |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AEAD              | XChaCha20-Poly1305 (`@noble/ciphers`) | 24-byte nonce, so random nonces need no counter state that must survive an app restart                                                                                    |
| Share combination | XOR                                   | a 2-of-2 split with one uniformly random operand is information-theoretically perfect and has no failure mode to get subtly wrong                                         |
| Key agreement     | X25519 sealed box (`@noble/curves`)   | the owner has only the guardian's public key; the ephemeral secret is discarded, so even the sealer cannot reopen it                                                      |
| KDF               | HKDF-SHA-256 (`@noble/hashes`)        | turns the raw ECDH point into a uniform key, and derives per-chunk nonces                                                                                                 |
| Paper checksum    | CRC-16/CCITT-FALSE                    | detects **all** burst errors ≤ 16 bits; a mistyped Base32 character is a ≤ 13-bit burst, so single-character typos are caught with certainty rather than with probability |

## Format notes

**Envelope** — every ciphertext this package produces is `nonce(24) ‖ ct‖tag(16)`.
`sealToGuardian` prefixes an extra `ephPub(32)`.

**Paper code** — `WSY<version>-XXXX-…`, 14 groups of 4. The payload is
`version(1) ‖ S_paper(32) ‖ CRC-16(2)` = 280 bits, which divides by 5 exactly,
so there is no padding and no ragged final group. The alphabet is digits `2-9`
plus `A-Z` minus `I` and `O` — exactly 32 symbols with no `0`/`O` or `1`/`I`
confusion. The version appears both in the prefix and inside the checksummed
payload, and the decoder rejects a code whose two copies disagree.

**Encrypted asset** —

```
header(29) ‖ chunk₀ ‖ chunk₁ ‖ …
header = "WSYA"(4) ‖ version(1) ‖ chunkSize(4) ‖ chunkCount(4) ‖ salt(16)
```

Two properties carry the weight here:

- **The salt is fresh per encryption.** Chunk nonces are _derived_
  (`HKDF(dek, salt, "wassiya/asset-chunk/v1" ‖ index)`), not random, so a second
  encryption of different content under the same DEK would otherwise reuse every
  nonce — the one failure that breaks XChaCha outright. The random salt makes
  each encryption's nonce stream unique even under deliberate DEK reuse.
- **The whole header is the AAD of every chunk**, which binds `chunkCount` into
  each chunk's tag. Per-chunk tags alone do not catch a _truncation_: every
  surviving chunk still verifies. This does.

Chunks are 1 MiB by default and independently decryptable, so a viewer can open
page one of a large document without downloading the rest — use `createAssetHeader`
/ `encryptChunk` / `decryptChunk` for that path, and `encryptAsset` /
`decryptAsset` for whole buffers.

**Not hidden:** the blob length leaks the plaintext length to within a chunk, and
the bundle length leaks roughly how many assets an heir is routed. Padding is not
attempted — if that ever matters, it belongs in the format, not at a call site.

## Randomness

`randomBytes` reads `globalThis.crypto.getRandomValues` and throws a named error
if it is absent, rather than falling back to anything weaker. Hermes has no
`crypto` global of its own, so an Expo app must import `expo-crypto` (or
`react-native-get-random-values`) once at entry, **before** the first call into
this package.

## Rotation

Rotation is re-wrapping, never re-keying MK — the assets stay readable.

- New paper sheet → `rotatePaperShare(mk, sGuardian)`, bump `paperVersion`, save
  the new `mkWrappedByRecovery`. The old sheet stops working immediately.
- New guardian → `rotateGuardianShare(mk, sPaper)`, seal the new share to the
  new guardian's key. The outgoing guardian's copy becomes worthless.
- Routing change → `makeHeirShares()` + `buildReleaseBundle` for every affected
  heir, then `release.saveBundles`. Old bundles and old shares stop matching.

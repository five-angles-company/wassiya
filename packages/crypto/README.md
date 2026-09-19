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
    │ DAILY UNLOCK    │          │ RECOVERY (1-of-1) │         │ PER-ASSET         │
    │                 │          │                   │         │                   │
    │ Enc(K_device,MK)│          │ Enc(K_rec, MK)    │         │ Enc(MK, DEKᵢ)     │
    │ K_device is a   │          │ K_rec = S_paper   │         │ DEKᵢ random per   │
    │ hardware key    │          │                   │         │ asset             │
    │ gated by        │          │ S_paper → printed │         │                   │
    │ biometrics      │          │   sheet only      │         │ Enc(DEKᵢ, content)│
    │ (outside this   │          │                   │         │   chunked, 1 MiB  │
    │  package)       │          │ AAD binds userId  │         │                   │
    └─────────────────┘          │   + paperVersion  │         └─────────┬─────────┘
                                 └───────────────────┘                   │
                                                                         │
   HEIR RELEASE — heirs never see MK, only the DEKs routed to them ───────┘
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  bundleₕ = Enc(K_h, { routed DEKs, message keys })                       │
   │  K_h     = fresh random bytes per rebuild                                │
   │                                                                          │
   │  lockedₕ = RSA-OAEP-SHA256(escrow public key, { ownerId, heirId, K_h })  │
   │            locked on the owner's device with a key pinned in the app;    │
   │            the private half lives in a key vault (Cloud KMS in prod)     │
   │  Unlocked ONLY by the release action, after certificate + staff match +  │
   │            veto window + the heir's own Didit match, then sealed to a    │
   │            one-time X25519 key in the heir's browser (`seal.ts`).        │
   │                                                                          │
   │  Rebuilt by the owner's device on every routing change.                   │
   └──────────────────────────────────────────────────────────────────────────┘
```

## Not key material, but the same stakes

`mnemonic.ts` validates a BIP-39 recovery phrase's checksum. It holds no key
and derives nothing — it exists because ٤.٣ must refuse to store a phrase that
cannot be right, and the person who would otherwise discover the mistake is an
heir who cannot ask what it should have said. Same reason `apps/mobile/lib/iban.ts`
validates mod-97 before saving a bank account.

## Which side runs what

| Function                                                   | Owner's device  |  Heir's client  | Convex backend        |
| ---------------------------------------------------------- | :-------------: | :-------------: | :-------------------: |
| `generateMk`, `generateDek`                                |       ✅        |        —        |       ❌ never        |
| `wrap` / `unwrap`, `seal` / `open`                         |       ✅        |       ✅        |       ❌ never        |
| `splitRecovery`, `rotatePaperShare`                        |       ✅        |        —        |       ❌ never        |
| `recoverMk`                                                | ✅ (new device) |        —        |       ❌ never        |
| `encodePaperCode` / `decodePaperCode`                      |       ✅        |        —        |       ❌ never        |
| `generateHeirKey`, `buildReleaseBundle`, `lockHeirKey`     |       ✅        |        —        |       ❌ never        |
| `parseUnlockedHeirKey`, `sealKeyTo`                        |        —        |        —        | ✅ `escrow.ts` only  |
| `generateSealKeypair`, `openSealedKey`, `openReleaseBundle` |        —        | ✅ (at release) |       ❌ never        |
| `encryptAsset` / `encryptChunk`                            |       ✅        |        —        |       ❌ never        |
| `decryptAsset` / `decryptChunk`                            |       ✅        |       ✅        |       ❌ never        |

What the backend _does_ touch is ciphertext — `mkWrappedByRecovery`,
`dekWrappedByMk`, the release bundle blob — and `lockedKey`, which it cannot
read without the key vault. The one place K_h exists server-side is the memory
of `convex/escrow.ts`'s release action; see AGENTS.md "Escrowed release".

## Primitives

| Concern           | Choice                                | Why                                                                                                                                                                       |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AEAD              | XChaCha20-Poly1305 (`@noble/ciphers`) | 24-byte nonce, so random nonces need no counter state that must survive an app restart                                                                                    |
| Share combination | XOR                                   | a 2-of-2 split with one uniformly random operand is information-theoretically perfect and has no failure mode to get subtly wrong                                         |
| Key agreement     | X25519 sealed box (`@noble/curves`)   | hands K_h to a one-time browser key; the ephemeral secret is discarded, so even the sealer cannot reopen it                                                              |
| Escrow lock       | RSA-OAEP-SHA256, ≥ 3072-bit (BigInt)  | the parameters Cloud KMS unlocks; encryption-only, so no private-key arithmetic lives on the device                                                                       |
| KDF               | HKDF-SHA-256 (`@noble/hashes`)        | turns the raw ECDH point into a uniform key, and derives per-chunk nonces                                                                                                 |
| Paper checksum    | CRC-16/CCITT-FALSE                    | detects **all** burst errors ≤ 16 bits; a mistyped Base32 character is a ≤ 13-bit burst, so single-character typos are caught with certainty rather than with probability |

## Format notes

**Envelope** — every ciphertext this package produces is `nonce(24) ‖ ct‖tag(16)`.
`sealKeyTo` prefixes an extra `ephPub(32)`.

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

- New paper sheet → `rotatePaperShare(mk, userId, nextPaperVersion)`, then save
  the wrapper **and** that version together. The old sheet stops working the
  moment the new wrapper lands — and not a moment before, which is why the
  caller must show the new code and get it acknowledged *first*. Saving on the
  way in turns a theft mitigation into a total-loss bug: the wrapper would then
  stand under a code printed nowhere, with nothing to fall back on.
- Routing change → `generateHeirKey()` + `buildReleaseBundle` + `lockHeirKey`
  for every affected heir, then `release.saveBundles`. The old K_h opens
  nothing newer.
- New escrow key version → pin it in `apps/mobile/lib/escrow-key.ts` and set
  `ESCROW_KEY_ID`; devices re-lock on their next rebuild.

# `@workspace/crypto`

The client-side key hierarchy for Wassiya. Pure TypeScript, no build step, no
React Native / DOM / Node imports — the same source runs in Expo (Hermes), the
browser, a Next.js server and Vitest.

> **This package is for devices, never for the backend.** No Convex function
> imports it: the backend stores wrappers and holds no key.
> `pnpm --filter @workspace/backend verify` fails the build if one does.

```bash
pnpm --filter @workspace/crypto test
```

## Key hierarchy

```
  MK — 256-bit master key, generated on the owner's phone, never leaves it unencrypted
   │
   ├── DAILY UNLOCK   MK in the OS keystore behind biometrics (outside this package)
   ├── RECOVERY       Enc(S_paper, MK), AAD binds userId + paperVersion;
   │                  S_paper exists only on the printed recovery sheet
   ├── PER ASSET      Enc(MK, DEKᵢ) — a random DEK per asset
   │                    ├── labelSealed  = Enc(DEKᵢ, title + subtitle)
   │                    ├── secretSealed = Enc(DEKᵢ, the type's fields as JSON)
   │                    └── each file    = Enc(DEKᵢ, bytes), chunked, one blob each
   └── RELEASE KEY R  one per owner; Enc(MK, R), AAD binds ownerId
                        ├── per handed-over asset   Enc(R, DEKᵢ), AAD binds ownerId|assetId
                        └── per executor sheet      Enc(S_exec, R), AAD binds
                                                    ownerId|executorId|sheetVersion;
                                                    S_exec exists only on that sheet
```

After a verified death, an executor's browser opens the handover with their
sheet: `S_exec → R → DEKᵢ → the asset`. The owner's recovery sheet is the
fallback: `S_paper → MK → R → DEKᵢ`. A private asset has no wrapper under R, so
nothing opens it after the owner. Wassiya never holds S_paper, S_exec, MK, R or
any DEK — if every sheet is lost, the handover cannot be opened by anyone.

## Not key material, but the same stakes

`mnemonic.ts` validates a BIP-39 recovery phrase's checksum. It holds no key
and derives nothing — it exists because ٤.٣ must refuse to store a phrase that
cannot be right, and the person who would otherwise discover the mistake is an
executor who cannot ask what it should have said. Same reason
`apps/mobile/lib/iban.ts` validates mod-97 before saving a bank account.

## Which side runs what

| Function                                                        | Owner's phone | Executor's browser | Convex backend |
| --------------------------------------------------------------- | :-----------: | :----------------: | :------------: |
| `generateMk`, `generateDek`, `generateReleaseKey`               |      ✅       |         —          |    ❌ never    |
| `wrap` / `unwrap`, `seal` / `open`                              |      ✅       |         —          |    ❌ never    |
| `splitRecovery`, `rotatePaperShare`                             |      ✅       |         —          |    ❌ never    |
| `recoverMk`, `decodePaperCode`                                  |      ✅       |   ✅ (fallback)    |    ❌ never    |
| `encodePaperCode`, `encodeExecutorCode`                         |      ✅       |         —          |    ❌ never    |
| `wrapReleaseKeyForOwner` / `unwrapReleaseKeyForOwner`           |      ✅       |   ✅ (unwrap)      |    ❌ never    |
| `wrapReleaseKeyForExecutor`, `wrapDekForHandover`               |      ✅       |         —          |    ❌ never    |
| `decodeExecutorCode`, `unwrapReleaseKeyForExecutor`, `unwrapDekFromHandover`, `paperCodeKind` | — | ✅ | ❌ never |
| `sealLabel`, `sealSecret`, `encryptAsset`                       |      ✅       |         —          |    ❌ never    |
| `openLabel`, `openSecret`, `decryptAsset`                       |      ✅       |         ✅         |    ❌ never    |

## Primitives

| Concern        | Choice                                | Why                                                                                                                                                                       |
| -------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AEAD           | XChaCha20-Poly1305 (`@noble/ciphers`) | 24-byte nonce, so random nonces need no counter state that must survive an app restart                                                                                    |
| KDF            | HKDF-SHA-256 (`@noble/hashes`)        | derives per-chunk nonces for files                                                                                                                                        |
| Paper checksum | CRC-16/CCITT-FALSE                    | detects **all** burst errors ≤ 16 bits; a mistyped Base32 character is a ≤ 13-bit burst, so single-character typos are caught with certainty rather than with probability |

## Format notes

**Envelope** — every ciphertext this package produces is `nonce(24) ‖ ct‖tag(16)`,
so a wrapped 32-byte key is 72 bytes.

**Domain separation** — the label, the secret, and each release wrapper
(`wassiya/release/v1|owner|…`, `|asset|…`, `|executor|…`) carry their own
versioned AAD, so one kind of ciphertext can never be opened as another under
the same key.

**Paper codes** — `WSY<version>-XXXX-…` for the recovery sheet and
`WSE<version>-XXXX-…` for an executor sheet, 14 groups of 4. The payload is
`version(1) ‖ secret(32) ‖ CRC-16(2)` = 280 bits, which divides by 5 exactly, so
there is no padding and no ragged final group. The executor code folds its own
domain into the checksum, so a code of one kind never decodes as the other
(`paperCodeKind` tells them apart). The alphabet is digits `2-9` plus `A-Z`
minus `I` and `O` — exactly 32 symbols with no `0`/`O` or `1`/`I` confusion.
The version appears both in the prefix and inside the checksummed payload, and
the decoder rejects a code whose two copies disagree.

**Encrypted file** —

```
header(29) ‖ chunk₀ ‖ chunk₁ ‖ …
header = "WSYA"(4) ‖ version(1) ‖ chunkSize(4) ‖ chunkCount(4) ‖ salt(16)
```

Two properties carry the weight here:

- **The salt is fresh per encryption.** Chunk nonces are _derived_
  (`HKDF(dek, salt, "wassiya/asset-chunk/v1" ‖ index)`), not random, so a second
  encryption of different content under the same DEK would otherwise reuse every
  nonce — the one failure that breaks XChaCha outright. The random salt makes
  each encryption's nonce stream unique, which is what lets an edit reuse the DEK.
- **The whole header is the AAD of every chunk**, which binds `chunkCount` into
  each chunk's tag. Per-chunk tags alone do not catch a _truncation_: every
  surviving chunk still verifies. This does.

Every file is framed on its own. Concatenating two files and decrypting them as
one fails, by design.

**Not hidden:** a blob's length leaks the plaintext length to within a chunk,
and the number of files leaks how many photos an album holds. Padding is not
attempted — if that ever matters, it belongs in the format, not at a call site.

## Randomness

`randomBytes` reads `globalThis.crypto.getRandomValues` and throws a named error
if it is absent, rather than falling back to anything weaker. Hermes has no
`crypto` global of its own, so an Expo app must install one (`ensureWebCrypto`)
**before** the first call into this package.

## Rotation

Rotation is re-wrapping, never re-keying MK or R — the assets stay readable.

- New recovery sheet → `rotatePaperShare(mk, userId, nextPaperVersion)`, then
  save the wrapper **and** that version together. The old sheet stops working
  the moment the new wrapper lands — and not a moment before, which is why the
  caller must show the new code and get it acknowledged *first*. Saving on the
  way in turns a theft mitigation into a total-loss bug: the wrapper would then
  stand under a code printed nowhere, with nothing to fall back on.
- New executor sheet → the same ordering: a fresh S_exec, R wrapped under it at
  the next sheet version, saved only after the new sheet is printed.
- Handing an asset over or back → wrap its DEK under R, or delete that wrapper.
  An edit reuses the DEK, so the wrapper keeps working.
- R itself is never replaced: every handover wrapper and every executor sheet
  is built on it.

# `@workspace/crypto`

The client-side key hierarchy for Wassiya. Pure TypeScript, no build step, no
React Native / DOM / Node imports — the same source runs in Expo (Hermes), the
browser, a Next.js server, Convex and Vitest.

> **This package is for devices, not for the backend.** The one exception is
> the release gate, `convex/escrow.ts`, which opens the escrowed keys of one
> delivery. Every other Convex function stores the outputs of these functions
> and never calls them.

```bash
pnpm --filter @workspace/crypto test
```

## Key hierarchy

Three keys, and one rule.

```
  MK — 256-bit master key, generated on the owner's phone, never leaves it unencrypted
   │
   ├── DAILY UNLOCK   MK in the OS keystore behind biometrics (outside this package)
   ├── RECOVERY       Enc(S_paper, MK), AAD binds userId + paperVersion;
   │                  S_paper exists only on the printed sheet
   └── PER ASSET      Enc(MK, DEKᵢ) — a random DEK per asset
                        ├── labelSealed  = Enc(DEKᵢ, title + subtitle)
                        ├── secretSealed = Enc(DEKᵢ, the type's fields as JSON)
                        └── each file    = Enc(DEKᵢ, bytes), chunked, one blob each

  ESCROW KEY — an X25519 keypair. The public half is pinned in the mobile app;
               the secret half is ESCROW_PRIVATE_KEY in the Convex env.

  The rule: when an asset is routed to anyone, the phone seals its DEK to the
  escrow key, bound to ownerId|assetId. At release the gate opens this heir's
  DEKs and returns them to the heir's browser, which decrypts everything itself.
  Unrouted assets are never sealed, so they open for no one.
```

The trade is deliberate and stated in AGENTS.md: whoever holds admin on the
production Convex deployment holds the escrow secret, so routed items are
protected by the release gate's code and the audit log, not by cryptography.

## Not key material, but the same stakes

`mnemonic.ts` validates a BIP-39 recovery phrase's checksum. It holds no key
and derives nothing — it exists because ٤.٣ must refuse to store a phrase that
cannot be right, and the person who would otherwise discover the mistake is an
heir who cannot ask what it should have said. Same reason `apps/mobile/lib/iban.ts`
validates mod-97 before saving a bank account.

## Which side runs what

| Function                                              | Owner's phone   | Heir's browser | Convex backend          |
| ----------------------------------------------------- | :-------------: | :------------: | :---------------------: |
| `generateMk`, `generateDek`                           |       ✅        |       —        |        ❌ never         |
| `wrap` / `unwrap`, `seal` / `open`                    |       ✅        |       —        |        ❌ never         |
| `splitRecovery`, `rotatePaperShare`, `recoverMk`      |       ✅        |       —        |        ❌ never         |
| `encodePaperCode` / `decodePaperCode`                 |       ✅        |       —        |        ❌ never         |
| `sealLabel`, `sealSecret`, `encryptAsset`             |       ✅        |       —        |        ❌ never         |
| `openLabel`, `openSecret`, `decryptAsset`             |       ✅        |       ✅       |        ❌ never         |
| `sealForEscrow`                                       |       ✅        |       —        |        ❌ never         |
| `openFromEscrow`                                      |        —        |       —        | ✅ `escrow.ts` only     |

## Primitives

| Concern       | Choice                                | Why                                                                                                                                                                       |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AEAD          | XChaCha20-Poly1305 (`@noble/ciphers`) | 24-byte nonce, so random nonces need no counter state that must survive an app restart                                                                                    |
| Escrow lock   | X25519 sealed box (`@noble/curves`)   | seals a DEK to a public key with nothing else shared; the ephemeral secret is discarded, so not even the sealer can reopen it                                              |
| KDF           | HKDF-SHA-256 (`@noble/hashes`)        | turns the raw ECDH point into a uniform key, and derives per-chunk nonces                                                                                                 |
| Paper checksum | CRC-16/CCITT-FALSE                   | detects **all** burst errors ≤ 16 bits; a mistyped Base32 character is a ≤ 13-bit burst, so single-character typos are caught with certainty rather than with probability |

## Format notes

**Envelope** — every ciphertext this package produces is `nonce(24) ‖ ct‖tag(16)`.
`sealKeyTo` prefixes an extra `ephPub(32)`, so a sealed key is 104 bytes.

**Domain separation** — the label, the secret, a message and a sealed box each
carry their own versioned AAD, so one kind of ciphertext can never be opened as
another under the same key.

**Paper code** — `WSY<version>-XXXX-…`, 14 groups of 4. The payload is
`version(1) ‖ S_paper(32) ‖ CRC-16(2)` = 280 bits, which divides by 5 exactly,
so there is no padding and no ragged final group. The alphabet is digits `2-9`
plus `A-Z` minus `I` and `O` — exactly 32 symbols with no `0`/`O` or `1`/`I`
confusion. The version appears both in the prefix and inside the checksummed
payload, and the decoder rejects a code whose two copies disagree.

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

Rotation is re-wrapping, never re-keying MK — the assets stay readable.

- New paper sheet → `rotatePaperShare(mk, userId, nextPaperVersion)`, then save
  the wrapper **and** that version together. The old sheet stops working the
  moment the new wrapper lands — and not a moment before, which is why the
  caller must show the new code and get it acknowledged *first*. Saving on the
  way in turns a theft mitigation into a total-loss bug: the wrapper would then
  stand under a code printed nowhere, with nothing to fall back on.
- Routing change → nothing, unless an asset goes from unrouted to routed (seal
  its DEK) or back (the backend deletes the sealed copy).
- New escrow key → not built. Every routed item sealed under the old key would
  have to be re-sealed from an owner's phone.

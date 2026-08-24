/**
 * `@workspace/crypto` — the client-side key hierarchy for Wassiya.
 *
 * Every function here is meant to run on a *device*: the owner's phone, the
 * guardian's phone, or the heir's browser at claim time. Nothing in this
 * package is safe to call from a Convex function, because a Convex function
 * that holds plaintext key material has already broken the zero-knowledge
 * guarantee. See README.md for which side runs what.
 */
export {
  KEY_BYTES,
  NONCE_BYTES,
  TAG_BYTES,
  bytesToHex,
  bytesToUtf8,
  concatBytes,
  equalBytes,
  hexToBytes,
  randomBytes,
  utf8ToBytes,
  xor,
} from "./bytes"

export { generateDek, generateMk } from "./keys"
export { open, seal, unwrap, wrap } from "./wrap"

export {
  type RecoveryMaterial,
  recoverMk,
  rotateGuardianShare,
  rotatePaperShare,
  splitRecovery,
} from "./recovery"

export {
  type DecodedPaperCode,
  crc16,
  decodePaperCode,
  encodePaperCode,
} from "./papercode"

export {
  type GuardianKeypair,
  X25519_KEY_BYTES,
  generateGuardianKeypair,
  guardianPublicKey,
  openFromGuardian,
  sealToGuardian,
} from "./guardian"

export {
  type HeirShares,
  type KeyMap,
  type ReleaseBundleContents,
  buildReleaseBundle,
  heirKey,
  makeHeirShares,
  openReleaseBundle,
} from "./heir"

export {
  type AssetHeader,
  DEFAULT_CHUNK_SIZE,
  createAssetHeader,
  decryptAsset,
  decryptChunk,
  encryptAsset,
  encryptChunk,
  parseAssetHeader,
} from "./asset"

export { type AssetLabel, LABEL_AAD, openLabel, sealLabel } from "./label"

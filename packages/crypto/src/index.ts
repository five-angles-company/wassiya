/**
 * `@workspace/crypto` — the client-side key hierarchy for Wassiya.
 *
 * Every function here is meant to run on a *device*: the owner's phone or the
 * heir's browser. The one exception is the release gate (`convex/escrow.ts`),
 * which opens the escrowed keys of one delivery; nothing else server-side may
 * import this package.
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
} from "./bytes"

export { generateDek, generateMk } from "./keys"
export { open, seal, unwrap, wrap } from "./wrap"

export {
  type RecoveryMaterial,
  RECOVERY_WRAPPER_VERSION,
  recoverMk,
  recoveryAad,
  rotatePaperShare,
  splitRecovery,
} from "./recovery"

export {
  type DecodedPaperCode,
  crc16,
  decodePaperCode,
  encodePaperCode,
  looksLikeRecoveryCode,
} from "./papercode"

export {
  type EscrowSubject,
  escrowAad,
  openFromEscrow,
  parseEscrowKey,
  sealForEscrow,
} from "./escrow"

export {
  SEAL_KEY_BYTES,
  SEALED_KEY_BYTES,
  type SealKeypair,
  generateSealKeypair,
  openSealedKey,
  sealKeyTo,
} from "./seal"

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
export { MAX_SECRET_BYTES, SECRET_AAD, openSecret, sealSecret } from "./secret"
export { MESSAGE_AAD, openMessage, sealMessage } from "./message"

export {
  type MnemonicCheck,
  MNEMONIC_LENGTHS,
  canonicalMnemonic,
  checkMnemonic,
  normalizeMnemonic,
} from "./mnemonic"

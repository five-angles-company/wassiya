/**
 * `@workspace/crypto` — the client-side key hierarchy for Wassiya.
 *
 * Every function here runs on a *device*: the owner's phone or an executor's
 * browser. No server code imports this package — the backend stores wrappers
 * and never holds a key.
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
  type DecodedExecutorCode,
  type DecodedPaperCode,
  crc16,
  decodeExecutorCode,
  decodePaperCode,
  encodeExecutorCode,
  encodePaperCode,
  looksLikeRecoveryCode,
  paperCodeKind,
} from "./papercode"

export {
  type ExecutorSheet,
  type HandoverAsset,
  generateReleaseKey,
  unwrapDekFromHandover,
  unwrapReleaseKeyForExecutor,
  unwrapReleaseKeyForOwner,
  wrapDekForHandover,
  wrapReleaseKeyForExecutor,
  wrapReleaseKeyForOwner,
} from "./release"

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

export {
  type MnemonicCheck,
  MNEMONIC_LENGTHS,
  canonicalMnemonic,
  checkMnemonic,
  normalizeMnemonic,
} from "./mnemonic"

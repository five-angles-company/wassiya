/**
 * `@workspace/crypto` — the client-side key hierarchy for Wassiya.
 *
 * Every function here is meant to run on a *device*: the owner's phone or the
 * heir's browser at release. The one exception is the escrow unlock action
 * (`convex/escrow.ts`), which parses an unlocked K_h and seals it straight to
 * the heir's browser; nothing else server-side may import this package.
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
  RECOVERY_WRAPPER_VERSION,
  recoverMk,
  recoveryAad,
  rotatePaperShare,
  splitRecovery,
} from "./recovery"

export {
  type CodeFormat,
  type DecodedPaperCode,
  type DecodedSecretCode,
  RECOVERY_CODE_FORMAT,
  crc16,
  decodePaperCode,
  decodeSecretCode,
  encodePaperCode,
  encodeSecretCode,
} from "./papercode"

export {
  type KeyMap,
  type ReleaseBundleContents,
  buildReleaseBundle,
  generateHeirKey,
  openReleaseBundle,
} from "./heir"

export {
  type EscrowPublicKey,
  type HeirKeyContext,
  escrowKeyFingerprint,
  lockHeirKey,
  parseEscrowPublicKey,
  parseUnlockedHeirKey,
} from "./escrow"

export {
  SEAL_KEY_BYTES,
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

export {
  MESSAGE_AAD,
  MESSAGE_KEY_ID,
  openMessage,
  sealMessage,
} from "./message"

export {
  type MnemonicCheck,
  MNEMONIC_LENGTHS,
  canonicalMnemonic,
  checkMnemonic,
  normalizeMnemonic,
} from "./mnemonic"

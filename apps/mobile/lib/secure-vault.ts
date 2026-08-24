/**
 * The device leg of the 2-of-3, and the only module in this app that touches
 * key material at rest.
 *
 * MK and S_guardian live in the OS keystore behind `requireAuthentication`,
 * which is what makes "your fingerprint unlocks the key sealed inside this
 * device" true rather than decorative. Two consequences shape everything here:
 *
 *  1. **Reading an authenticated item prompts.** So the splash screen cannot
 *     use MK's presence as its routing probe — it would greet every cold start
 *     with a biometric sheet. `readEnrolment` exists for that: a small
 *     *unauthenticated* marker written alongside the key, carrying no secret.
 *
 *  2. **Authenticated items are invalidated when the enrolled biometrics
 *     change.** Adding a fingerprint or re-enrolling a face makes MK
 *     permanently unreadable and `getItemAsync` starts returning `null` — with
 *     the marker still in place. So a `null` from `readMk` is not a bug to
 *     swallow: it means this device has lost its key and the caller must route
 *     to recovery. `VaultKeyLostError` names that case so a caller cannot
 *     confuse it with "not enrolled yet".
 *
 * Nothing here ever returns key material to a Convex function. The only bytes
 * that leave the device are produced by `@workspace/crypto` and are already
 * wrapped — see `screens/setup/recovery-kit`.
 */
import * as Crypto from "expo-crypto"
import * as SecureStore from "expo-secure-store"
import { bytesToHex, hexToBytes } from "@workspace/crypto/bytes"
import { generateGuardianKeypair } from "@workspace/crypto/guardian"
import { generateMk } from "@workspace/crypto/keys"

import { ensureWebCrypto } from "@/lib/crypto-polyfill"

/** MK: 32 random bytes, generated on this device, never sent anywhere. */
const MK_KEY = "wassiya.mk.v1"

/** S_guardian: held here until a guardian accepts and it can be sealed to them. */
const GUARDIAN_SHARE_KEY = "wassiya.sguardian.v1"

/**
 * The **guardian role's** X25519 secret key — a different thing entirely from
 * `GUARDIAN_SHARE_KEY` above, despite the similar name.
 *
 * `wassiya.sguardian.v1` is a share of *this user's own* recovery key, held
 * while they are an owner waiting for a guardian to accept.
 * `wassiya.guardiankey.v1` is the private half of the keypair this user
 * publishes when they act as **someone else's** guardian, and it is what opens
 * every share sealed to them.
 *
 * One person can be both at once — an owner with a vault and a guardian for
 * their sibling — so the two never share a slot. Losing this key means every
 * share sealed to this guardian is unopenable, which is why it lives behind
 * the same biometric gate as MK rather than in plain storage.
 */
const GUARDIAN_KEY = "wassiya.guardiankey.v1"

/** The unauthenticated routing probe. Contains no secret. */
const ENROLMENT_KEY = "wassiya.enrolment.v1"

/** Stable per-install id, so `devices.register` is idempotent across retries. */
const INSTALL_ID_KEY = "wassiya.install.v1"

/**
 * Authenticated items get their own keychain service. expo-secure-store warns
 * that a service shared between authenticated and unauthenticated entries does
 * not behave correctly, and the marker below is deliberately unauthenticated.
 */
const VAULT_SERVICE = "wassiya.vault"

const authenticated = (
  authenticationPrompt: string
): SecureStore.SecureStoreOptions => ({
  keychainService: VAULT_SERVICE,
  requireAuthentication: true,
  authenticationPrompt,
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
})

/**
 * Thrown when the keystore has an entry we know exists but can no longer hand
 * back — the biometric-change invalidation described above. Distinct from
 * "never enrolled", because the two route to completely different screens.
 */
export class VaultKeyLostError extends Error {
  constructor(what: string) {
    super(
      `${what} is enrolled on this device but the keystore can no longer ` +
        "return it. Changing the device's enrolled biometrics invalidates it " +
        "permanently."
    )
    this.name = "VaultKeyLostError"
  }
}

/**
 * The unauthenticated marker. Its shape is the app's answer to "how far did
 * this install get?", and every field is safe to read without a prompt.
 */
export type VaultEnrolment = {
  /** The `devices` row this install registered as, once it has one. */
  deviceId: string | null
  /** True once S_guardian has been written to the keystore. */
  hasGuardianShare: boolean
  /** True once this device holds a guardian keypair — see `GUARDIAN_KEY`. */
  isGuardian?: boolean
  /** `keyring.paperVersion` at the last successful save, for diagnostics. */
  paperVersion: number | null
  enrolledAt: number
}

export async function readEnrolment(): Promise<VaultEnrolment | null> {
  const raw = await SecureStore.getItemAsync(ENROLMENT_KEY)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as VaultEnrolment
  } catch {
    // A corrupt marker is indistinguishable from no marker for routing
    // purposes, and the authenticated items are the real source of truth.
    return null
  }
}

/** Merge into the existing marker, creating it if this is the first write. */
export async function patchEnrolment(
  patch: Partial<Omit<VaultEnrolment, "enrolledAt">>
): Promise<VaultEnrolment> {
  const current = await readEnrolment()
  const next: VaultEnrolment = {
    deviceId: patch.deviceId ?? current?.deviceId ?? null,
    hasGuardianShare:
      patch.hasGuardianShare ?? current?.hasGuardianShare ?? false,
    isGuardian: patch.isGuardian ?? current?.isGuardian ?? false,
    paperVersion: patch.paperVersion ?? current?.paperVersion ?? null,
    enrolledAt: current?.enrolledAt ?? Date.now(),
  }
  await SecureStore.setItemAsync(ENROLMENT_KEY, JSON.stringify(next))
  return next
}

/**
 * Read-or-create the install id. Called — and therefore persisted — *before*
 * `devices.register`, so a crash between the two cannot enrol this phone twice.
 */
export async function getInstallId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(INSTALL_ID_KEY)
  if (existing !== null) return existing
  const installId = Crypto.randomUUID()
  await SecureStore.setItemAsync(INSTALL_ID_KEY, installId)
  return installId
}

/**
 * Generate MK and seal it into the keystore. Returns the key so the caller can
 * finish the ceremony without a second prompt; it must not be persisted or
 * handed to anything that leaves the device.
 *
 * Idempotent by contract, not by hope: callers check `readEnrolment` first.
 * Generating twice would orphan the first key and, with it, any vault already
 * wrapped under it.
 */
export async function generateAndStoreMk(
  authenticationPrompt: string
): Promise<Uint8Array> {
  // Hermes has no Web Crypto global and `generateMk` refuses to run without
  // one. Installed here rather than at app entry — see `ensureWebCrypto`.
  ensureWebCrypto()
  const mk = generateMk()
  await SecureStore.setItemAsync(
    MK_KEY,
    bytesToHex(mk),
    authenticated(authenticationPrompt)
  )
  return mk
}

/**
 * MK, behind the biometric prompt. Throws `VaultKeyLostError` if the keystore
 * has invalidated it.
 */
export async function readMk(
  authenticationPrompt: string
): Promise<Uint8Array> {
  const hex = await SecureStore.getItemAsync(
    MK_KEY,
    authenticated(authenticationPrompt)
  )
  if (hex === null) throw new VaultKeyLostError("The vault key")
  return hexToBytes(hex)
}

/**
 * S_guardian stays here until a guardian accepts, at which point it is sealed
 * to their X25519 key and this copy is deleted. Written *before* `keyring.save`
 * so a crash between the two cannot leave a server-side keyring row that this
 * device is then unable to rotate.
 */
export async function storeGuardianShare(
  share: Uint8Array,
  authenticationPrompt: string
): Promise<void> {
  await SecureStore.setItemAsync(
    GUARDIAN_SHARE_KEY,
    bytesToHex(share),
    authenticated(authenticationPrompt)
  )
}

export async function readGuardianShare(
  authenticationPrompt: string
): Promise<Uint8Array> {
  const hex = await SecureStore.getItemAsync(
    GUARDIAN_SHARE_KEY,
    authenticated(authenticationPrompt)
  )
  if (hex === null) throw new VaultKeyLostError("The guardian share")
  return hexToBytes(hex)
}

/**
 * Forget this device's copy of everything. Used when a read proves the
 * keystore has invalidated the key, so the app stops claiming an enrolment it
 * cannot honour. The install id survives — it identifies the handset, not the
 * vault, and reusing it keeps `devices.register` idempotent.
 */
export async function clearVault(): Promise<void> {
  await SecureStore.deleteItemAsync(MK_KEY, { keychainService: VAULT_SERVICE })
  await SecureStore.deleteItemAsync(GUARDIAN_SHARE_KEY, {
    keychainService: VAULT_SERVICE,
  })
  await SecureStore.deleteItemAsync(ENROLMENT_KEY)
}

/**
 * Generate this device's guardian keypair and seal the secret half here.
 *
 * Called once, when the user accepts their first guardian invitation. The
 * public half is what they publish to `guardians.accept`; the secret half never
 * leaves this device, which is the entire reason a sealed share is safe for the
 * server to hold.
 *
 * Returns the public key so the caller can publish it without a second
 * biometric prompt.
 */
export async function generateAndStoreGuardianKey(
  authenticationPrompt: string
): Promise<Uint8Array> {
  ensureWebCrypto()
  const { secretKey, publicKey } = generateGuardianKeypair()
  await SecureStore.setItemAsync(
    GUARDIAN_KEY,
    bytesToHex(secretKey),
    authenticated(authenticationPrompt)
  )
  secretKey.fill(0)
  return publicKey
}

/**
 * This device's guardian secret key, behind the biometric prompt.
 *
 * Throws `VaultKeyLostError` when the keystore has invalidated it — for a
 * guardian that is not merely inconvenient: every share sealed to them becomes
 * unopenable, and the owners who chose them have to enrol a replacement. The
 * caller must surface it rather than retrying.
 */
export async function readGuardianKey(
  authenticationPrompt: string
): Promise<Uint8Array> {
  const hex = await SecureStore.getItemAsync(
    GUARDIAN_KEY,
    authenticated(authenticationPrompt)
  )
  if (hex === null) throw new VaultKeyLostError("The guardian key")
  return hexToBytes(hex)
}

/** Whether this device has ever acted as a guardian. Unauthenticated probe. */
export async function hasGuardianKey(): Promise<boolean> {
  const enrolment = await readEnrolment()
  return enrolment?.isGuardian === true
}

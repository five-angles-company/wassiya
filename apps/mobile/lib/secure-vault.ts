/**
 * The device leg, and the only module in this app that touches key material at
 * rest. MK lives in the OS keystore behind `requireAuthentication`; it is the
 * only secret here, since K_rec is the printed sheet alone and the guardian
 * keypair left with the guardian screens (guardians are web users).
 *
 * Two consequences shape everything:
 *
 *  1. **Reading an authenticated item prompts.** The splash screen therefore
 *     cannot probe for MK's presence — it would greet every cold start with a
 *     biometric sheet. `readEnrolment` is the unauthenticated marker written
 *     alongside the key, carrying no secret.
 *  2. **Authenticated items are invalidated when enrolled biometrics change.**
 *     `getItemAsync` then returns `null` with the marker still in place, so a
 *     `null` from `readMk` is not a bug to swallow — this device has lost its
 *     key and the caller must route to recovery. `VaultKeyLostError` names that
 *     case so it cannot be confused with "not enrolled yet".
 *
 * Nothing here returns key material to a Convex function.
 */
import * as Crypto from "expo-crypto"
import * as SecureStore from "expo-secure-store"
import { bytesToHex, hexToBytes } from "@workspace/crypto/bytes"
import { generateMk } from "@workspace/crypto/keys"

import { ensureWebCrypto } from "@/lib/crypto-polyfill"

/** MK: 32 random bytes, generated on this device, never sent anywhere. */
const MK_KEY = "wassiya.mk.v1"

/**
 * Two slots used to live here and both are gone.
 *
 * `wassiya.sguardian.v1` held S_guardian, this owner's half of the old K_rec.
 * Recovery is the sheet alone now, so there is no such share to hold.
 *
 * `wassiya.guardiankey.v1` held the X25519 secret this user published when
 * acting as **someone else's** guardian. Guardians are web users; nothing in
 * the owner's app reads it any more.
 *
 * `clearVault` still deletes the first, so an install that predates this change
 * does not keep a share for a key that no longer exists. The guardian keypair is
 * deliberately *not* deleted: it is the only copy of a secret that opens shares
 * sealed to that person, and destroying it from an app that no longer uses it
 * would be an irreversible act taken on their behalf.
 */
const LEGACY_GUARDIAN_SHARE_KEY = "wassiya.sguardian.v1"

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
  /**
   * `keyring.paperVersion` at the last successful save.
   *
   * No longer only diagnostic: the recovery wrapper is sealed under an AAD that
   * includes this number, so recovery on a *fresh* device reads it from the
   * server rather than from here — this copy is the local record of what this
   * install last wrote.
   */
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
 * Forget this device's copy of everything. Used when a read proves the
 * keystore has invalidated the key, so the app stops claiming an enrolment it
 * cannot honour. The install id survives — it identifies the handset, not the
 * vault, and reusing it keeps `devices.register` idempotent.
 */
export async function clearVault(): Promise<void> {
  await SecureStore.deleteItemAsync(MK_KEY, { keychainService: VAULT_SERVICE })
  // Still cleared, for installs that predate the single-share recovery model.
  await SecureStore.deleteItemAsync(LEGACY_GUARDIAN_SHARE_KEY, {
    keychainService: VAULT_SERVICE,
  })
  await SecureStore.deleteItemAsync(ENROLMENT_KEY)
}

/**
 * Seal a **recovered** MK into this device's keystore.
 *
 * Distinct from `generateAndStoreMk`, which mints a new key during setup. Here
 * the key already exists — it was just rebuilt from the paper share and the
 * guardian's — and generating a fresh one instead would orphan the entire
 * vault it was meant to reopen. Two functions rather than one flag, because
 * that is the sort of mistake a boolean invites.
 *
 * Idempotent by contract, not by hope: 8.1 only reaches here when
 * `readEnrolment()` said this device has no key.
 */
export async function storeRecoveredMk(
  mk: Uint8Array,
  authenticationPrompt: string
): Promise<void> {
  if (mk.length !== 32) {
    throw new Error("A recovered master key must be 32 bytes")
  }
  await SecureStore.setItemAsync(
    MK_KEY,
    bytesToHex(mk),
    authenticated(authenticationPrompt)
  )
}

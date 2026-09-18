import { bytesToHex, hexToBytes, randomBytes, utf8ToBytes } from "@workspace/crypto/bytes"
import { GUARDIAN_SHEET_VERSION } from "@workspace/crypto/guardianKey"
import { open, seal } from "@workspace/crypto/wrap"

/**
 * A guardian's key, kept on the device they accepted on — sealed, and openable
 * only by that device's own authenticator. A guardian is asked to produce a
 * printed code at one ceremony, possibly years later; this keeps a copy so the
 * sheet can be re-shown without typing fifty-six characters off a page.
 *
 * **The paper is still the durable copy and everything here fails closed** — no
 * passkey, a wiped device, a browser with no PRF all land the reader back on
 * typing the sheet. Nothing in the release ceremony depends on this existing.
 *
 * A passkey rather than plain storage: storing the secret in the clear would
 * make the browser a second copy of the sheet, so any XSS on this origin would
 * hold the guardian's half of every K_h. WebAuthn's `prf` extension yields a
 * 32-byte value only that authenticator can reproduce and only after user
 * verification, so what sits at rest is ciphertext and "access to the device" is
 * literally the check. The PRF output is HMAC-derived and uniform, so it is used
 * as the key directly; the stored salt separates this use from any other the
 * credential serves, and the AAD binds the blob to its own credential id.
 *
 * Registering takes **two** WebAuthn calls and that is not a mistake: `create()`
 * reports whether PRF is available but implementations need not return its
 * output, and Chrome does not. Create, check `enabled`, then `get()` once to
 * obtain the value.
 */

const STORE_KEY = "wassiya.guardian-key.v1"
const AAD_PREFIX = "wassiya/guardian-device-key/v1|"

/**
 * The DOM lib in this TypeScript version has no `prf` member on the WebAuthn
 * extension types, so the two boundaries are typed here and cast once each.
 * Narrow, local, and adjacent to the calls they describe — rather than a global
 * augmentation that would silently claim support the runtime may not have.
 */
type PrfInputs = {
  prf?: { eval?: { first: BufferSource } }
}
type PrfOutputs = {
  prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } }
}

type StoredKey = {
  v: 1
  /** base64url, as WebAuthn wants it back in `allowCredentials`. */
  credentialId: string
  /** hex — the PRF salt, which is what separates this use from any other. */
  salt: string
  /** hex — `seal(prfKey, secretKey, aad)`. Useless without the authenticator. */
  sealed: string
  /** hex — so the UI can name the vaults this matches without unsealing. */
  publicKey: string
  version: number
}

export type DeviceKeyStatus =
  | { state: "absent" }
  | { state: "held"; publicKey: Uint8Array }

/** Can this browser even be asked? Never assume on the server. */
export function deviceKeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential === "function" &&
    typeof navigator.credentials?.create === "function"
  )
}

export function readDeviceKey(): DeviceKeyStatus {
  const stored = readStored()
  if (stored === null) return { state: "absent" }
  return { state: "held", publicKey: hexToBytes(stored.publicKey) }
}

/**
 * Forget the copy on this device.
 *
 * Deliberately available whether or not the authenticator answers: a reader on
 * a shared or borrowed machine must be able to remove the blob without first
 * proving they can open it.
 */
export function forgetDeviceKey(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORE_KEY)
  notify()
}

export type SaveOutcome = "saved" | "unsupported" | "declined"

/**
 * Seal this secret to the device's authenticator and keep it.
 *
 * Returns rather than throws for the two ordinary outcomes — no PRF, or the
 * reader dismissing the prompt — because neither is an error: the sheet in
 * their hand still works and the caller's job is to say so, not to apologise.
 */
export async function saveDeviceKey({
  secretKey,
  publicKey,
  version = GUARDIAN_SHEET_VERSION,
  label,
}: {
  secretKey: Uint8Array
  publicKey: Uint8Array
  version?: number
  /** Shown by the platform's own passkey prompt. */
  label: string
}): Promise<SaveOutcome> {
  if (!deviceKeySupported()) return "unsupported"

  let prfKey: Uint8Array | undefined
  try {
    const created = (await navigator.credentials.create({
      publicKey: {
        rp: { name: "Wassiya" },
        user: {
          id: randomBytes(16) as BufferSource,
          name: label,
          displayName: label,
        },
        challenge: randomBytes(32) as BufferSource,
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          // ⚠️ **No `authenticatorAttachment`, deliberately.** It was
          // `"platform"`, which on Windows means Windows Hello and nothing
          // else — and Windows Hello does not expose `hmac-secret`, so the
          // `prf` extension comes back disabled and the seal is impossible on
          // most Windows machines however many times it is tried.
          //
          // What the feature needs is an authenticator that can do PRF, not one
          // that is physically inside this box. Leaving attachment unset lets
          // the browser offer whatever it has — Chrome's own password manager,
          // a security key, a phone — and the sealed blob stays in this
          // browser's storage either way. Only the key that opens it moves.
          //
          // `residentKey` is `"preferred"` rather than `"required"` for a
          // related reason: a discoverable credential is one this site cannot
          // delete and the reader must clean up by hand, and every failed PRF
          // attempt left one behind. The credential id is kept beside the
          // sealed blob, and losing that storage loses the seal regardless, so
          // discoverability buys nothing here.
          residentKey: "preferred",
          userVerification: "required",
        },
        extensions: { prf: {} } as PrfInputs,
      },
    })) as PublicKeyCredential | null

    if (created === null) return "declined"
    const enabled = (created.getClientExtensionResults() as PrfOutputs).prf
      ?.enabled
    if (enabled !== true) return "unsupported"

    const salt = randomBytes(32)
    prfKey = await evaluatePrf(created.rawId, salt)
    if (prfKey === undefined) return "unsupported"

    const credentialId = toBase64Url(new Uint8Array(created.rawId))
    const sealed = seal(prfKey, secretKey, aadFor(credentialId))

    write({
      v: 1,
      credentialId,
      salt: bytesToHex(salt),
      sealed: bytesToHex(sealed),
      publicKey: bytesToHex(publicKey),
      version,
    })
    return "saved"
  } catch {
    // `NotAllowedError` covers both a dismissed prompt and a timeout, and the
    // two are indistinguishable by design — the platform will not say which.
    return "declined"
  } finally {
    prfKey?.fill(0)
  }
}

/**
 * Unlock the stored key.
 *
 * `null` for every reason a reader cannot be helped right now — nothing stored,
 * prompt dismissed, a credential that no longer exists on this device. The
 * caller shows the typed-code path, which is the same thing they would have
 * done before any of this existed.
 */
export async function loadDeviceKey(): Promise<{
  secretKey: Uint8Array
  version: number
} | null> {
  const stored = readStored()
  if (stored === null || !deviceKeySupported()) return null

  let prfKey: Uint8Array | undefined
  try {
    prfKey = await evaluatePrf(
      fromBase64Url(stored.credentialId).buffer as ArrayBuffer,
      hexToBytes(stored.salt)
    )
    if (prfKey === undefined) return null

    return {
      secretKey: open(
        hexToBytes(stored.sealed),
        prfKey,
        aadFor(stored.credentialId)
      ),
      version: stored.version,
    }
  } catch {
    return null
  } finally {
    prfKey?.fill(0)
  }
}

/** One `get()`, for the PRF output alone. `undefined` if it came back empty. */
async function evaluatePrf(
  credentialId: ArrayBuffer,
  salt: Uint8Array
): Promise<Uint8Array | undefined> {
  const asserted = (await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32) as BufferSource,
      allowCredentials: [{ type: "public-key", id: credentialId }],
      userVerification: "required",
      extensions: { prf: { eval: { first: salt as BufferSource } } } as PrfInputs,
    },
  })) as PublicKeyCredential | null

  const result = (asserted?.getClientExtensionResults() as PrfOutputs | undefined)
    ?.prf?.results?.first
  return result === undefined ? undefined : new Uint8Array(result)
}

/** Binds a sealed blob to its own credential — it will not open under another. */
function aadFor(credentialId: string): Uint8Array {
  return utf8ToBytes(AAD_PREFIX + credentialId)
}

function readStored(): StoredKey | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    // A record this app did not write, or wrote under an older shape, is
    // discarded rather than trusted — it holds nothing that cannot be
    // reproduced from the printed sheet.
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as StoredKey).v !== 1
    ) {
      return null
    }
    const record = parsed as StoredKey
    if (
      typeof record.credentialId !== "string" ||
      typeof record.salt !== "string" ||
      typeof record.sealed !== "string" ||
      typeof record.publicKey !== "string"
    ) {
      return null
    }
    return record
  } catch {
    // Private mode, a cleared profile, or a browser set to block site data.
    return null
  }
}

function write(record: StoredKey): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(record))
    notify()
  } catch {
    // Storage refused. The sheet still exists; nothing is lost that matters.
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Subscribe to the presence of a stored key.
 *
 * `localStorage` is an external store, so React reads it through
 * `useSyncExternalStore` rather than an effect that calls `setState` — which is
 * both the lint rule and the correct answer: an effect would render `absent`
 * first and correct itself, and a panel that flickers into existence on a page
 * about key custody reads as a fault.
 *
 * The browser's own `storage` event fires only for *other* tabs, so saving and
 * forgetting notify locally as well. Without that, removing the copy would
 * leave the panel on screen until a reload.
 */
const listeners = new Set<() => void>()

export function subscribeDeviceKey(onChange: () => void): () => void {
  listeners.add(onChange)
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onChange)
  }
  return () => {
    listeners.delete(onChange)
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onChange)
    }
  }
}

/** A boolean, not a record: `useSyncExternalStore` re-renders on identity. */
export function deviceKeyHeldSnapshot(): boolean {
  return readStored() !== null
}

/** The server knows nothing about this device. */
export function deviceKeyHeldServerSnapshot(): boolean {
  return false
}

function notify(): void {
  for (const listener of listeners) listener()
}

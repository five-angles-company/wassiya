"use node"

// The one unlock path — AGENTS.md "Escrowed release".
//
//  - `unlockHeirKey` is module-private and `openDelivery` is its only caller.
//    Nothing else in this deployment may import a key-vault client or read
//    `ESCROW_DEV_PRIVATE_KEY`; `scripts/verify-invariants.mjs` enforces it.
//  - Every precondition is re-checked by `release.releaseGate`, which runs as
//    the calling heir. This action trusts nothing it is passed.
//  - The attempt is audited *before* the unlock, so a failure is on record.
//  - K_h leaves only sealed to the heir's one-time browser key, and is zeroed
//    here once sealed. It is never returned, logged or thrown in an error.
//  - `ESCROW_BACKEND=dev` is refused when `WASSIYA_ENV=production`.
import {
  constants,
  createPrivateKey,
  createSign,
  privateDecrypt,
} from "node:crypto"

import { parseUnlockedHeirKey } from "@workspace/crypto/escrow"
import { SEAL_KEY_BYTES, sealKeyTo } from "@workspace/crypto/seal"
import { v } from "convex/values"

import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { action } from "./_generated/server"

export const openDelivery = action({
  args: {
    deliveryId: v.id("deliveries"),
    browserPublicKey: v.bytes(),
  },
  handler: async (
    ctx,
    { deliveryId, browserPublicKey }
  ): Promise<{
    bundleUrl: string
    sealedKey: ArrayBuffer
    expiresAt: number
  }> => {
    if (browserPublicKey.byteLength !== SEAL_KEY_BYTES) {
      throw new Error("Not found")
    }
    const gate: {
      subjectUserId: Id<"users">
      heirId: Id<"heirs">
      bundleUrl: string | null
      lockedKey: ArrayBuffer
      escrowKeyId: string
      expiresAt: number
    } | null = await ctx.runQuery(internal.release.releaseGate, { deliveryId })
    if (gate === null || gate.bundleUrl === null) {
      throw new Error("Not found")
    }

    await ctx.runMutation(internal.release.recordOpened, { deliveryId })

    const plaintext = await unlockHeirKey(
      new Uint8Array(gate.lockedKey),
      gate.escrowKeyId
    )
    let kH: Uint8Array | undefined
    try {
      kH = parseUnlockedHeirKey(plaintext, {
        ownerId: gate.subjectUserId,
        heirId: gate.heirId,
      })
      const sealed = sealKeyTo(kH, new Uint8Array(browserPublicKey))
      return {
        bundleUrl: gate.bundleUrl,
        sealedKey: sealed.buffer.slice(
          sealed.byteOffset,
          sealed.byteOffset + sealed.byteLength
        ) as ArrayBuffer,
        expiresAt: gate.expiresAt,
      }
    } catch {
      throw new Error("Not found")
    } finally {
      plaintext.fill(0)
      kH?.fill(0)
    }
  },
})

async function unlockHeirKey(
  lockedKey: Uint8Array,
  escrowKeyId: string
): Promise<Uint8Array> {
  const backend = process.env.ESCROW_BACKEND ?? "dev"
  if (backend === "dev") {
    if (process.env.WASSIYA_ENV === "production") {
      throw new Error("The dev escrow key is refused in production")
    }
    if (escrowKeyId !== process.env.ESCROW_KEY_ID) {
      throw new Error("Not found")
    }
    const pem = process.env.ESCROW_DEV_PRIVATE_KEY
    if (pem === undefined) {
      throw new Error("ESCROW_DEV_PRIVATE_KEY is not set on this deployment")
    }
    // One base64 line of the PKCS#8 DER is the stored form: a multi-line PEM
    // does not survive `npx convex env set` on Windows, which keeps only its
    // first line. A PEM with escaped newlines is still accepted.
    const key = pem.startsWith("-----BEGIN")
      ? createPrivateKey(pem.replace(/\\n/g, "\n"))
      : createPrivateKey({
          key: Buffer.from(pem, "base64"),
          format: "der",
          type: "pkcs8",
        })
    return new Uint8Array(
      privateDecrypt(
        { key, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
        lockedKey
      )
    )
  }
  if (backend === "gcp") {
    // `escrowKeyId` is the key version's resource name, and must be the one
    // this deployment is configured for.
    if (escrowKeyId !== process.env.ESCROW_KEY_ID) {
      throw new Error("Not found")
    }
    return await cloudKmsDecrypt(escrowKeyId, lockedKey)
  }
  throw new Error(`Escrow backend "${backend}" is not available`)
}

/**
 * Cloud KMS `asymmetricDecrypt` over REST (RSA_DECRYPT_OAEP_*_SHA256).
 *
 * Authenticates as the service account in `GCP_SERVICE_ACCOUNT` (the JSON key
 * file, base64 on one line — a multi-line value does not survive
 * `npx convex env set` on Windows). That account must hold only
 * `roles/cloudkms.cryptoKeyDecrypter` on this one key. Both CRC32C checks are
 * made: KMS confirms it received the ciphertext intact, and the plaintext is
 * checked against the checksum KMS returns.
 */
async function cloudKmsDecrypt(
  keyVersionName: string,
  ciphertext: Uint8Array
): Promise<Uint8Array> {
  const encoded = process.env.GCP_SERVICE_ACCOUNT
  if (encoded === undefined) {
    throw new Error("GCP_SERVICE_ACCOUNT is not set on this deployment")
  }
  const account = JSON.parse(
    Buffer.from(encoded, "base64").toString("utf8")
  ) as {
    client_email: string
    private_key: string
  }

  const now = Math.floor(Date.now() / 1000)
  const segment = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url")
  const unsigned = `${segment({ alg: "RS256", typ: "JWT" })}.${segment({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/cloudkms",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 300,
  })}`
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(account.private_key)
    .toString("base64url")

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  })
  if (!tokenResponse.ok) {
    throw new Error(`Cloud KMS auth failed (${tokenResponse.status})`)
  }
  const { access_token: accessToken } = (await tokenResponse.json()) as {
    access_token: string
  }

  const response = await fetch(
    `https://cloudkms.googleapis.com/v1/${keyVersionName}:asymmetricDecrypt`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ciphertext: Buffer.from(ciphertext).toString("base64"),
        ciphertextCrc32c: String(crc32c(ciphertext)),
      }),
    }
  )
  if (!response.ok) {
    throw new Error(`Cloud KMS decrypt failed (${response.status})`)
  }
  const result = (await response.json()) as {
    plaintext: string
    plaintextCrc32c: string
    verifiedCiphertextCrc32c: boolean
  }
  const plaintext = new Uint8Array(Buffer.from(result.plaintext, "base64"))
  if (
    !result.verifiedCiphertextCrc32c ||
    String(crc32c(plaintext)) !== result.plaintextCrc32c
  ) {
    plaintext.fill(0)
    throw new Error("Cloud KMS response failed its integrity check")
  }
  return plaintext
}

/** CRC32C (Castagnoli), which Cloud KMS uses to detect corruption in transit. */
function crc32c(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0x82f63b78 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

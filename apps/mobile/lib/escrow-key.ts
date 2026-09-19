/**
 * The escrow public keys heir delivery keys are locked to — AGENTS.md
 * "Escrowed release".
 *
 * ⚠️ Pinned here, never fetched. A key served by the backend would let a
 * compromised server substitute its own and receive every K_h. The fingerprint
 * is checked against the PEM before every lock, so an edit to one without the
 * other fails loudly instead of locking to the wrong key.
 *
 * `id` must equal `ESCROW_KEY_ID` on the matching Convex deployment, which
 * `release.saveBundles` enforces. Production stays `null` until the Cloud KMS
 * key exists: with no pinned key the device refuses to build bundles rather than
 * lock to the development key.
 */
export type PinnedEscrowKey = { id: string; pem: string; fingerprint: string }

const DEVELOPMENT: PinnedEscrowKey = {
  id: "dev-1",
  fingerprint:
    "80f1e3dee765c7e081133d5360998cb47ed1a84e87b36783d657484f4c61479f",
  pem: `-----BEGIN PUBLIC KEY-----
MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAuoB+KVac4Tq5FhnzDTLd
cFIr//zFSrtpr1XJL0lBdMK+JsvTE2bU95k4zKBmolU2qDzQ1pMoFYJCEu78Dd9l
8VYHMh/meUUf9PTTu7wahjosvj+NpaAl/uiOThkPInkV3qwi1+yiiKrBRqwZ29dt
fRmgxhAStszp6O6rLXizH02ISDgXN95FsVxPq0t7RoTGeotydk0W7jYuG/DAgk8U
lxmT8XHCQDfq4F9R3rKPUbTHwtMY2tnpm5Wx/9IJ7O2uw7LzP+Alrxs9mrklchZK
4S3hafmpgvY0C5wagP//BEM7pvKCGE50DHEEVWMaMjTgh/Oszx/wGEUbT78XCNyc
ztlPQTjww5tBG8zF7MCFEqsZzgE4xrJO9cNgm+nFdy195GEZdQQzbxFCHjYzP5uP
3CSIKFsKL3exNI17VE+eUOKJDmiBxCW1RWimgV9ur1KNPxALAzYBQqutW4KuKnkj
5AKn97BBrAFaH91bA70q02o3oua1Z5TzhQuFkxEEWO0DAgMBAAE=
-----END PUBLIC KEY-----`,
}

const PRODUCTION: PinnedEscrowKey | null = null

export function pinnedEscrowKey(): PinnedEscrowKey | null {
  return process.env.EXPO_PUBLIC_WASSIYA_ENV === "production"
    ? PRODUCTION
    : DEVELOPMENT
}

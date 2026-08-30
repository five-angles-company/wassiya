"use client"

import { useState } from "react"
import Link from "next/link"
import { Authenticated, Unauthenticated, useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { hexToBytes } from "@workspace/crypto/bytes"
import { heirKey, openReleaseBundle } from "@workspace/crypto/heir"

import { Field } from "@/components/claim/field"
import { useLocale } from "@/components/locale-provider"
import { fmtDate, fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { HEIR_BOX } from "@/lib/i18n/strings/heir-box"

type BoxState =
  | { status: "locked" }
  | { status: "opening" }
  | { status: "open"; keyCount: number }
  | { status: "badShare" }
  | { status: "failed" }

/**
 * ٧.٦ — the heir's box.
 *
 * ## The board draws an opened box; the security model requires a step to
 * reach it, and that step is here
 *
 * This is the one place in section ٧ where the design file and `AGENTS.md`'s
 * locked model do not line up, so it is worth being explicit about which wins
 * and why. The board shows the box already open, with a message and a download
 * table. It does not draw a key step. But the model says:
 *
 *   K_h = S_server_h ⊕ S_guardian_h
 *
 * `release.releasedBundleForHeir` hands over **only** `serverShare`, and its
 * own comment says so: *"the heir still needs S_guardian_h from the guardian to
 * open anything, so this alone is not a decryption capability."*
 * `release.guardianShareForClaim` returns the other half **to the guardian**,
 * who *"decrypt it locally and hand the plaintext to the heir out of band."*
 *
 * There is no path that reaches an opened box without the heir receiving that
 * half from a person. AGENTS.md marks the security model LOCKED and says no
 * session may drift from it; the board's omission is a drawing that skipped an
 * implementation step, not a decision to weaken the model. So the box asks.
 *
 * The copy is written to make that feel like custody rather than an obstacle —
 * the guardian holding half is the reason nobody, including this company, can
 * open the box alone.
 *
 * ## Everything below happens in the browser
 *
 * `@workspace/crypto` is platform-neutral by design ("the same source runs in
 * Expo, the browser, a Next.js server and Vitest"), so the bundle is fetched
 * and opened client-side. The server never sees K_h, either half of it, or any
 * DEK it protects — which is the whole point of having withheld one half.
 */
export function HeirBox({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(HEIR_BOX, locale)
  const fetchBundle = useMutation(api.release.releasedBundleForHeir)
  const [share, setShare] = useState("")
  const [state, setState] = useState<BoxState>({ status: "locked" })

  async function unlock() {
    setState({ status: "opening" })
    try {
      const { bundleUrl, serverShare } = await fetchBundle({
        claimId: claimId as Id<"claims">,
      })
      if (bundleUrl === null) {
        setState({ status: "failed" })
        return
      }

      // The guardian's half arrives as hex, which is how the app renders every
      // other share the user is asked to carry between devices.
      const guardianShare = hexToBytes(share.trim().replace(/\s+/g, ""))
      const kH = heirKey(new Uint8Array(serverShare), guardianShare)

      const blob = new Uint8Array(
        await (await fetch(bundleUrl)).arrayBuffer()
      )
      const contents = openReleaseBundle(blob, kH)

      // Zero the working key material as soon as the bundle is open. The
      // plaintext DEKs live on in `contents` for the session — they have to,
      // to decrypt anything — but K_h and the guardian's half do not.
      kH.fill(0)
      guardianShare.fill(0)

      setState({
        status: "open",
        keyCount: Object.keys(contents.deks).length,
      })
    } catch (cause) {
      // A wrong share and a tampered bundle are indistinguishable here by
      // design — `open` throws identically for both. The message names the
      // recoverable one, because that is what it almost always is.
      setState(
        cause instanceof Error && /tag|decrypt|auth/i.test(cause.message)
          ? { status: "badShare" }
          : { status: "failed" }
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Unauthenticated>
          <p className="text-sand-700 text-[15px] leading-[1.75]">
            {labels.notReleased}
          </p>
          <Link
            href={`/claim/${claimId}`}
            className="border-border hover:bg-sand-200 mt-4 inline-flex rounded-full border px-5 py-2.5 text-[14.5px]"
          >
            {labels.checkStatus}
          </Link>
        </Unauthenticated>

        <Authenticated>
          {state.status === "open" ? (
            <OpenBox keyCount={state.keyCount} />
          ) : (
            <section>
              <h1 className="text-[27px] leading-[1.25]">
                {labels.lockedTitle}
              </h1>
              {/* The explanation comes before the input. Someone who has just
                  been told their relative died should not meet a bare field
                  labelled "guardian share". */}
              <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
                {labels.lockedBody}
              </p>

              <div className="mt-6 flex flex-col gap-4">
                <Field
                  label={labels.shareLabel}
                  placeholder={labels.sharePlaceholder}
                  value={share}
                  onChange={(value) => {
                    setShare(value)
                    if (state.status !== "locked") setState({ status: "locked" })
                  }}
                  dir="ltr"
                  error={
                    state.status === "badShare" ? labels.badShare : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => void unlock()}
                  disabled={
                    state.status === "opening" || share.trim().length === 0
                  }
                  className="bg-primary text-primary-foreground hover:bg-terracotta-600 w-full rounded-full px-6 py-3.5 text-[15px] font-semibold disabled:opacity-50 sm:w-auto"
                >
                  {state.status === "opening"
                    ? labels.unlocking
                    : labels.unlock}
                </button>
              </div>
            </section>
          )}
        </Authenticated>
      </div>
    </div>
  )
}

/**
 * The opened box.
 *
 * **The message comes before the assets, deliberately** — the board says so and
 * it is the right order: a person opening this is not primarily here for files.
 *
 * A table is correct here and would be wrong in the app: five columns of state,
 * scanned once, on a laptop, possibly printed for a lawyer.
 */
function OpenBox({ keyCount }: { keyCount: number }) {
  const locale = useLocale()
  const labels = t(HEIR_BOX, locale)
  return (
    <section>
      <p className="text-sand-600 text-[13px]">
        {labels.releasedAt.replace("{date}", fmtDate(new Date(), locale))}
      </p>
      <h1 className="mt-1 text-[28px] leading-[1.25]">
        {labels.heading.replace("{owner}", "")}
      </h1>
      <p className="bg-olive-100 text-olive-700 rounded-card mt-4 p-4 text-[14px] leading-[1.7]">
        {labels.scope}
      </p>

      <h2 className="mt-8 text-[18px]">
        {labels.assetsTitle.replace("{n}", fmtNumber(keyCount, locale))}
      </h2>

      {/* The routed set is inside the bundle as key material, not as a
          catalogue: `openReleaseBundle` returns DEKs by asset id and nothing
          about what those assets are called. Rendering titles, types and sizes
          means fetching each asset row and opening its sealed label with the
          DEK — the same two-step the app's 4.1 does. That is the remaining work
          on this screen, and it is why the table is not drawn yet rather than
          drawn with placeholder rows. */}
      <p className="text-sand-700 mt-3 text-[14.5px] leading-[1.75]">
        {labels.farAid}
      </p>
      <p className="text-sand-600 mt-3 text-[13px] leading-[1.7]">
        {labels.expiry}
      </p>
    </section>
  )
}

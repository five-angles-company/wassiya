"use client"

import { useState } from "react"
import Link from "next/link"
import { Authenticated, Unauthenticated, useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { hexToBytes } from "@workspace/crypto/bytes"
import { heirKey, openReleaseBundle } from "@workspace/crypto/heir"
import {
  ArrowDownIcon,
  ArrowRightIcon,
  KeyRoundIcon,
  LaptopIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t, type Resolved } from "@/lib/i18n/locale"
import { HEIR_BOX } from "@/lib/i18n/strings/heir-box"

type BoxState =
  | { status: "locked" }
  | { status: "opening" }
  | { status: "open"; keyCount: number }
  | { status: "badShare" }
  | { status: "failed" }

/**
 * ٧.٦ — the heir's box, and the gate in front of it.
 *
 * ## The gate is the screen, not an obstacle in front of it
 *
 *   K_h = S_server_h ⊕ S_guardian_h
 *
 * `release.releasedBundleForHeir` hands over **only** `serverShare`; the other
 * half reaches the heir from a person. There is no path to an opened box that
 * skips that, and the design does not try to hide it — it draws it. Our half
 * and the guardian's, side by side, and the line that explains why it is built
 * this way: *"Two, never one."*
 *
 * That framing is the whole design. "Enter a key" is a chore. "Nobody can open
 * this alone, including us" is the product's central promise, arriving at the
 * exact moment it can be demonstrated rather than asserted.
 *
 * ## Everything below happens in the browser
 *
 * `@workspace/crypto` is platform-neutral by design, so the bundle is fetched
 * and opened client-side. The server never sees K_h, either half of it, or any
 * DEK it protects — which is the entire point of having withheld one half.
 */
export function HeirBox({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(HEIR_BOX, locale)
  const fetchBundle = useMutation(api.release.releasedBundleForHeir)
  const [share, setShare] = useState("")
  const [state, setState] = useState<BoxState>({ status: "locked" })

  async function unlock() {
    setState({ status: "opening" })
    let kH: Uint8Array | undefined
    let guardianShare: Uint8Array | undefined
    try {
      const { bundleUrl, serverShare } = await fetchBundle({ claimId })
      if (bundleUrl === null) {
        setState({ status: "failed" })
        return
      }

      guardianShare = hexToBytes(share.trim().replace(/[\s-]/g, ""))
      kH = heirKey(new Uint8Array(serverShare), guardianShare)

      const blob = new Uint8Array(await (await fetch(bundleUrl)).arrayBuffer())
      const contents = openReleaseBundle(blob, kH)

      setState({
        status: "open",
        keyCount: Object.keys(contents.deks).length,
      })
    } catch (cause) {
      // A wrong half and a tampered bundle are indistinguishable here by
      // design — `open` throws identically for both. The message names the
      // recoverable one, because that is what it almost always is.
      setState(
        cause instanceof Error && /tag|decrypt|auth/i.test(cause.message)
          ? { status: "badShare" }
          : { status: "failed" }
      )
    } finally {
      // In `finally`, not at the end of `try`: a throw between deriving K_h and
      // opening the bundle would otherwise leave both halves sitting in memory
      // for the life of the page — which is the one case where it matters.
      kH?.fill(0)
      guardianShare?.fill(0)
    }
  }

  if (state.status === "open") {
    return <OpenedBox keyCount={state.keyCount} labels={labels} />
  }

  const error =
    state.status === "badShare"
      ? labels.badShare
      : state.status === "failed"
        ? labels.failed
        : undefined

  return (
    <>
      <Unauthenticated>
        <div className="max-w-[560px]">
          <p className="text-[17px] leading-[1.7] opacity-80">
            {labels.signInFirst}
          </p>
          <Link
            href={`/sign-in?redirect_url=/heir/${claimId}`}
            className="bg-primary text-primary-foreground hover:bg-terracotta-600 font-heading mt-6 inline-flex h-[60px] items-center rounded-full px-9 text-[18px] font-extrabold transition-colors"
          >
            {labels.signIn}
          </Link>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="grid items-center gap-9 lg:grid-cols-[1fr_.9fr] lg:gap-10">
          <div>
            <h1 className="mb-5 text-[34px] leading-[1.08] font-black md:text-[50px]">
              {labels.gateTitle}
            </h1>
            <p className="mb-[30px] max-w-[560px] text-[17px] leading-[1.7] opacity-80 md:text-[17.5px]">
              {labels.gateBody}
            </p>

            <div className="max-w-[560px]">
              <label className="mb-2.5 block text-[14px] font-semibold">
                {labels.shareLabel}
              </label>
              {/* Bordered in terracotta rather than the usual hairline: it is
                  the only input on the screen and the only thing the reader is
                  being asked for. */}
              <input
                dir="ltr"
                value={share}
                onChange={(event) => {
                  setShare(event.target.value)
                  if (state.status !== "locked") setState({ status: "locked" })
                }}
                placeholder={labels.sharePlaceholder}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="characters"
                className="bg-card border-primary h-[70px] w-full rounded-full border-2 px-[26px] font-mono text-[17px] font-semibold tracking-[.06em] outline-none focus-visible:border-[color:var(--accent-foreground)]"
              />
              {error !== undefined && (
                <p className="text-terracotta-800 mt-3 text-[14px] leading-[1.65]">
                  {error}
                </p>
              )}

              <div className="mt-[22px] flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => void unlock()}
                  disabled={
                    state.status === "opening" || share.trim().length === 0
                  }
                  className="bg-primary text-primary-foreground hover:bg-terracotta-600 font-heading inline-flex h-[68px] items-center gap-[11px] rounded-full px-10 text-[19px] font-extrabold transition-colors disabled:opacity-50"
                >
                  {state.status === "opening" ? labels.unlocking : labels.unlock}
                  <ArrowRightIcon
                    className="size-5 rtl:-scale-x-100"
                    strokeWidth={2.75}
                    aria-hidden
                  />
                </button>
                <span className="max-w-[200px] text-[14px] leading-[1.55] opacity-60">
                  {labels.onDevice}
                </span>
              </div>
            </div>

            <div className="bg-muted mt-[30px] max-w-[600px] rounded-[26px] px-7 py-6">
              <div className="font-heading mb-2.5 text-[17px] font-extrabold">
                {labels.askTitle}
              </div>
              <p className="mb-3.5 text-[14.5px] leading-[1.7] opacity-[.78]">
                {labels.askBody}
              </p>
              <div className="flex flex-wrap gap-2.5">
                <span className="bg-primary text-primary-foreground rounded-full px-6 py-3.5 text-[14.5px] font-semibold">
                  {labels.nudge}
                </span>
                <span className="rounded-full border-[1.5px] border-[color:var(--border)] px-6 py-3.5 text-[14.5px] font-semibold">
                  {labels.cannotReach}
                </span>
              </div>
            </div>
          </div>

          <HowItOpens labels={labels} />
        </div>
      </Authenticated>
    </>
  )
}

/**
 * The mechanism, drawn.
 *
 * This is the one place in the product where exposing how the cryptography
 * works builds trust instead of confusing — because the reader is standing in
 * front of the exact gate it explains.
 */
function HowItOpens({ labels }: { labels: Resolved<typeof HEIR_BOX> }) {
  return (
    <aside className="rounded-[34px] bg-[#201e1d] px-10 pt-10 pb-11 text-[#f5ead8]">
      <div
        dir="ltr"
        className="mb-7 text-[13px] font-semibold tracking-[.14em] uppercase opacity-50"
      >
        {labels.howTitle}
      </div>

      <div className="mb-[26px] flex items-center gap-4">
        <div className="bg-primary text-primary-foreground flex-1 rounded-[24px] px-5 py-[22px] text-center">
          <KeyRoundIcon className="mx-auto mb-2.5 size-6" strokeWidth={2.4} aria-hidden />
          <div className="font-heading mb-1 text-[16px] font-extrabold">
            {labels.ourHalf}
          </div>
          <div className="text-[12.5px] opacity-85">{labels.ourHalfMeta}</div>
        </div>
        <span
          aria-hidden
          className="font-heading flex-none text-[26px] font-black opacity-40"
        >
          +
        </span>
        <div className="bg-secondary text-secondary-foreground flex-1 rounded-[24px] px-5 py-[22px] text-center">
          <ShieldCheckIcon className="mx-auto mb-2.5 size-6" strokeWidth={2.4} aria-hidden />
          <div className="font-heading mb-1 text-[16px] font-extrabold">
            {labels.guardianHalf}
          </div>
          <div className="text-[12.5px] opacity-85">
            {labels.guardianHalfMeta}
          </div>
        </div>
      </div>

      <div className="mb-[26px] flex justify-center">
        <ArrowDownIcon className="size-6 opacity-40" strokeWidth={2.4} aria-hidden />
      </div>

      <div className="mb-[26px] rounded-[24px] border-2 border-[color:rgba(245,234,216,.28)] px-[22px] py-[26px] text-center">
        <LaptopIcon className="mx-auto mb-2.5 size-6" strokeWidth={2.4} aria-hidden />
        <div className="font-heading mb-1.5 text-[18px] font-extrabold">
          {labels.opensHere}
        </div>
        <div className="text-[13px] leading-[1.65] opacity-60">
          {labels.opensHereMeta}
        </div>
      </div>

      <p className="text-[13.5px] leading-[1.75] opacity-60">
        {labels.twoNotOne}
      </p>
    </aside>
  )
}

/**
 * After the halves meet.
 *
 * The expiry was already stated on the status page — deliberately, so it could
 * not be discovered here for the first time — but it is repeated once, quietly,
 * because this is the screen someone will still be on in eighty days.
 */
function OpenedBox({
  keyCount,
  labels,
}: {
  keyCount: number
  labels: Resolved<typeof HEIR_BOX>
}) {
  return (
    <div className="bg-secondary text-secondary-foreground max-w-[820px] rounded-[34px] px-8 py-10 md:px-11">
      <ShieldCheckIcon className="mb-6 size-9" strokeWidth={2.2} aria-hidden />
      <h1 className="mb-5 text-[36px] leading-[1.08] font-black md:text-[46px]">
        {labels.openTitle}
      </h1>
      <p className="mb-7 max-w-[560px] text-[17px] leading-[1.72] opacity-90">
        {labels.openBody}
      </p>
      <div className="text-secondary inline-flex items-center rounded-full bg-[color:var(--secondary-foreground)] px-7 py-4 text-[17px] font-bold">
        {labels.keyCount.replace("{n}", String(keyCount))}
      </div>
      <p className="mt-7 text-[14px] leading-[1.65] opacity-75">
        {labels.expiry}
      </p>
    </div>
  )
}

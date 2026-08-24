"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Authenticated, Unauthenticated, useAction, useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"

import { ClaimStepper } from "@/components/claim/claim-stepper"
import { Field } from "@/components/claim/field"
import { CLAIM_IDENTITY } from "@/lib/claim-copy"
import { shortRef } from "@/lib/claim-ref"

type Phase = "filing" | "verify"

/**
 * The client half of ٧.٢: file the claim, then hand off to the KYC provider.
 *
 * ## Why the popup, and what happens when it is blocked
 *
 * The board wants the provider *"in a secure window"* rather than an iframe or
 * a redirect. A redirect would lose the tab someone has been filling in; an
 * iframe cannot host a camera permission prompt reliably. So: `window.open`,
 * and a **visible fallback** when the browser blocks it — a blocked popup with
 * no explanation is one of the board's own listed states and is otherwise a
 * dead end on the first real step.
 *
 * ## The phone hand-off
 *
 * *"laptop webcams fail document capture, and asking the user to start over on
 * a phone loses them."* The provider URL is a normal link, so the fix is simply
 * to make it copyable: open it on a phone and the same session continues.
 * Rendering a QR would need a client library; a copy button needs none and
 * works when a camera is what you are trying to avoid using.
 *
 * ## Gating on Convex's auth state, not Clerk's
 *
 * `<Authenticated>` is Convex's, per the repo's auth rule: Clerk can consider a
 * client signed in a beat before Convex has minted its token, and every
 * mutation below would fail in that window.
 */
export function IdentityFlow() {
  const router = useRouter()
  const submit = useMutation(api.claims.submit)
  const startSession = useAction(api.identity.startSession)
  const claims = useQuery(api.claims.mine)
  const me = useQuery(api.users.me)

  const [subjectEmail, setSubjectEmail] = useState("")
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [phase, setPhase] = useState<Phase>("filing")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providerUrl, setProviderUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // `submit` deliberately returns only `{ received: true }` so it cannot be
  // used to enumerate which emails have vaults. The claim id therefore comes
  // from the claimant's own list afterwards.
  const claim = claims?.[0] ?? null
  const verified = me?.identityStatus === "verified"

  async function fileClaim() {
    setBusy(true)
    setError(null)
    try {
      await submit({
        subjectEmail: subjectEmail.trim().toLowerCase(),
        claimantName: name.trim(),
        claimantContact: contact.trim(),
      })
      setPhase("verify")
    } catch {
      setError(CLAIM_IDENTITY.failed)
    } finally {
      setBusy(false)
    }
  }

  async function beginVerification() {
    setBusy(true)
    setError(null)
    try {
      const { url } = await startSession({
        callbackUrl:
          typeof window === "undefined"
            ? undefined
            : `${window.location.origin}/claim/certificate`,
      })
      setProviderUrl(url)
      const opened = window.open(url, "_blank", "width=520,height=720")
      // `null` means the browser blocked it. Say so and offer the link rather
      // than leaving the button looking broken.
      if (opened === null) setError(CLAIM_IDENTITY.popupBlocked)
    } catch {
      setError(CLAIM_IDENTITY.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ClaimStepper
      current={1}
      reference={claim === null ? undefined : shortRef(claim.id)}
    >
      <h1 className="text-[27px] leading-[1.25]">{CLAIM_IDENTITY.heading}</h1>
      <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
        {CLAIM_IDENTITY.intro}
      </p>

      <Unauthenticated>
        <section className="bg-card rounded-card mt-7 p-5">
          <h2 className="text-[17px]">{CLAIM_IDENTITY.signInTitle}</h2>
          <p className="text-sand-700 mt-2 text-[14px] leading-[1.7]">
            {CLAIM_IDENTITY.signInBody}
          </p>
          <Link
            href="/sign-in?redirect_url=/claim/identity"
            className="bg-primary text-primary-foreground hover:bg-terracotta-600 mt-4 inline-flex rounded-full px-6 py-2.5 text-[14.5px] font-semibold"
          >
            {CLAIM_IDENTITY.signIn}
          </Link>
        </section>
      </Unauthenticated>

      <Authenticated>
        {phase === "filing" && claim === null ? (
          <section className="mt-7 flex flex-col gap-4">
            <Field
              label={CLAIM_IDENTITY.subjectLabel}
              hint={CLAIM_IDENTITY.subjectHint}
              value={subjectEmail}
              onChange={setSubjectEmail}
              type="email"
              dir="ltr"
            />
            <Field
              label={CLAIM_IDENTITY.nameLabel}
              value={name}
              onChange={setName}
            />
            <Field
              label={CLAIM_IDENTITY.contactLabel}
              hint={CLAIM_IDENTITY.contactHint}
              value={contact}
              onChange={setContact}
              type="tel"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => void fileClaim()}
              disabled={
                busy ||
                subjectEmail.trim().length === 0 ||
                name.trim().length === 0 ||
                contact.trim().length === 0
              }
              className="bg-primary text-primary-foreground hover:bg-terracotta-600 mt-1 rounded-full px-6 py-3 text-[15px] font-semibold disabled:opacity-50"
            >
              {busy ? CLAIM_IDENTITY.filing : CLAIM_IDENTITY.fileClaim}
            </button>
          </section>
        ) : (
          <section className="mt-7">
            <ol className="flex flex-col gap-3">
              {CLAIM_IDENTITY.checks.map((check, index) => (
                <li key={check} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="bg-card text-terracotta-700 flex size-6 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold"
                  >
                    {"١٢٣"[index]}
                  </span>
                  <span className="text-[14.5px] leading-[1.55]">{check}</span>
                </li>
              ))}
            </ol>

            {verified ? (
              <div className="bg-olive-100 rounded-card mt-6 p-4">
                <p className="text-olive-700 text-[14.5px] font-semibold">
                  {CLAIM_IDENTITY.verified}
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/claim/certificate")}
                  className="bg-secondary text-secondary-foreground hover:bg-olive-600 mt-3 rounded-full px-5 py-2.5 text-[14.5px] font-semibold"
                >
                  {CLAIM_IDENTITY.continue}
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void beginVerification()}
                  disabled={busy}
                  className="bg-primary text-primary-foreground hover:bg-terracotta-600 mt-6 rounded-full px-6 py-3 text-[15px] font-semibold disabled:opacity-50"
                >
                  {busy ? CLAIM_IDENTITY.starting : CLAIM_IDENTITY.startVerify}
                </button>
                <p className="text-sand-600 mt-2 text-[12.5px]">
                  {CLAIM_IDENTITY.popupNote}
                </p>
              </>
            )}

            {/* The hand-off. Present whenever a session exists, because the
                laptop-webcam failure is discovered *after* the popup opens. */}
            {providerUrl !== null ? (
              <div className="bg-card rounded-card mt-5 p-4">
                <h2 className="text-[15.5px]">
                  {CLAIM_IDENTITY.handoffTitle}
                </h2>
                <p className="text-sand-700 mt-1.5 text-[13.5px] leading-[1.65]">
                  {CLAIM_IDENTITY.handoffBody}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(providerUrl)
                        .then(() => setCopied(true))
                        .catch(() => setCopied(false))
                    }}
                    className="border-border hover:bg-sand-200 rounded-full border px-4 py-2 text-[13.5px]"
                  >
                    {copied ? CLAIM_IDENTITY.copied : CLAIM_IDENTITY.copyLink}
                  </button>
                  <a
                    href={providerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="border-border hover:bg-sand-200 rounded-full border px-4 py-2 text-[13.5px]"
                  >
                    {CLAIM_IDENTITY.openInTab}
                  </a>
                </div>
              </div>
            ) : null}

            <div className="bg-card rounded-card mt-5 p-4">
              <h2 className="text-[15.5px]">
                {CLAIM_IDENTITY.whyNumberTitle}
              </h2>
              <p className="text-sand-700 mt-1.5 text-[13.5px] leading-[1.7]">
                {CLAIM_IDENTITY.whyNumberBody}
              </p>
            </div>
          </section>
        )}

        {error !== null ? (
          <p className="text-terracotta-800 mt-4 text-[14px] leading-[1.7]">
            {error}
          </p>
        ) : null}

        <p className="text-sand-600 mt-6 text-[12.5px] leading-[1.7]">
          {CLAIM_IDENTITY.privacyNote}
        </p>
      </Authenticated>
    </ClaimStepper>
  )
}

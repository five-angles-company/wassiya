"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { useConvexAuth, useMutation } from "convex/react"
import { Button, ButtonLink } from "@/components/button"
import { Ask } from "@/components/doc/ask"
import { DocSection } from "@/components/doc/section"
import { SetApart } from "@/components/doc/set-apart"
import { useLocale } from "@/components/locale-provider"
import { t, type Resolved } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { Field } from "@/features/claims/components/field"
import { CLAIMS } from "@/features/claims/strings/claims"

/**
 * Filing a report: three fields and a button.
 *
 * **It lands on the claim it just created.** That used to be impossible on
 * purpose: `submit` returned `{ received: true }` and created no row at all
 * when the address matched no vault, so that it could not be used to enumerate
 * which addresses have one.
 *
 * The cost fell on the wrong person. A bereaved claimant filled in three fields,
 * pressed the button, and was pushed to `/claims` — which, having no row to
 * show, told them they had never filed anything. And the defence was not even
 * working: a miss wrote nothing, and the rate limit counts rows, so probing
 * addresses with no vault was free and unlimited while a hit showed up in the
 * list seconds later.
 *
 * So every filing is now a claim, matched or not, and this navigates to it.
 * There is still no inline "we couldn't find that vault": the first two steps
 * ask nothing of the vault and look identical either way, and the answer comes
 * by email days later if nobody resolves it. The mutation is still not an
 * oracle — it is just no longer silent.
 *
 * The disabled button is surface-toned, never a faded primary: terracotta at
 * half opacity over sand is a muddy peach that reads as broken rather than
 * not-yet.
 *
 * ## ⚠️ The sign-in block is `Ask`, and it was a hand-rolled copy of one
 *
 * `heir-case.tsx` renders exactly this block — the same `signInTitle` — as
 * `<Ask>`. This file wrote it out instead, which cost it the eyebrow and set its
 * heading at 19px against `Ask`'s 21px, so the same sentence rendered two
 * different ways depending on which page you arrived from. Two pages disagreeing
 * about what "sign in to continue" looks like is the kind of drift nobody
 * reports and everybody feels.
 */
export function FileClaimForm() {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  /*
   * ⚠️ **The eyebrow is `common.askEyebrow`, not a string of this feature's
   * own.** "Asked of you now" has to read identically wherever an Ask appears,
   * or the phrase stops being a signal and becomes decoration that varies.
   */
  const common = t(COMMON, locale)
  const router = useRouter()
  const submit = useMutation(api.claims.submit)

  const [subjectEmail, setSubjectEmail] = useState("")
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, isLoading } = useConvexAuth()

  const ready =
    subjectEmail.trim().length > 0 &&
    name.trim().length > 0 &&
    contact.trim().length > 0

  async function file() {
    setBusy(true)
    setError(null)
    try {
      const { claimId } = await submit({
        subjectEmail: subjectEmail.trim().toLowerCase(),
        claimantName: name.trim(),
        claimantContact: contact.trim(),
      })
      router.push(`/case/${claimId}`)
    } catch {
      setError(labels.fileFailed)
      setBusy(false)
    }
    // No `finally`: on success the route is already changing, and clearing
    // `busy` there would re-enable the button for the frame before it unmounts.
  }

  return (
    <div className="flex flex-col gap-11">
      {/* Above the form, not beside it. It was a 330px sidebar, which put the
          one sentence that stops people stalling — you cannot finish this
          without the death certificate — in the weakest position on the page,
          to be read after the reader had already started typing. It is a
          precondition, so it comes first.

          It renders signed out too. That warning used to sit behind the sign-in
          wall: we asked someone to make an account before telling them what
          they would need. */}
      <Checklist labels={labels} />

      {isLoading || !isAuthenticated ? (
        <Ask eyebrow={common.askEyebrow} title={labels.signInTitle}>
          <p className="text-muted-foreground max-w-[66ch] text-[14.5px] leading-[1.75]">
            {labels.signInBody}
          </p>
          <div>
            <ButtonLink
              href={`/sign-in?redirect_url=${encodeURIComponent("/file")}`}
              size="lg"
            >
              {labels.signInAction}
            </ButtonLink>
          </div>
        </Ask>
      ) : (
      <SetApart>
        <div className="flex flex-col gap-5">
          <Field
            label={labels.subjectLabel}
            hint={labels.subjectHint}
            value={subjectEmail}
            onChange={setSubjectEmail}
            type="email"
            dir="ltr"
            placeholder={labels.subjectPlaceholder}
          />
          <Field label={labels.nameLabel} value={name} onChange={setName} />
          <Field
            label={labels.contactLabel}
            hint={labels.contactHint}
            value={contact}
            onChange={setContact}
            type="tel"
            dir="ltr"
            placeholder={labels.contactPlaceholder}
          />
        </div>

        <div className="border-border mt-7 border-t pt-6">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => void file()}
            disabled={busy || !ready}
          >
            {busy ? labels.filing : labels.fileClaim}
          </Button>

          {error !== null && (
            <p className="text-tone-attention mt-4 text-[14px] leading-[1.7]">
              {error}
            </p>
          )}

          <p className="text-muted-foreground mt-4 max-w-[66ch] text-[12.5px] leading-[1.7]">
            {labels.disclaimer}
          </p>
        </div>
      </SetApart>
      )}
    </div>
  )
}

/**
 * What to have to hand.
 *
 * The third item carries the longest explanation because "the email they
 * registered" is the one an heir usually has to go and find — and `needWhy`
 * says out loud that starting without the certificate is what stalls people,
 * which is the single most useful sentence on the screen.
 */
function Checklist({ labels }: { labels: Resolved<typeof CLAIMS> }) {
  const items = [
    { title: labels.needIdTitle, body: labels.needIdBody },
    { title: labels.needCertificateTitle, body: labels.needCertificateBody },
    { title: labels.needEmailTitle, body: labels.needEmailBody },
  ]

  return (
    <DocSection title={labels.needTitle}>
      <p className="text-muted-foreground max-w-[66ch] text-[14.5px] leading-[1.7]">
        {labels.needWhy}
      </p>

      <dl className="border-border divide-border divide-y border-y">
        {items.map((item) => (
          <div key={item.title} className="py-3.5">
            <dt className="text-[15px] font-semibold">{item.title}</dt>
            <dd className="text-muted-foreground mt-1 max-w-[66ch] text-[13.5px] leading-[1.65]">
              {item.body}
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-muted-foreground max-w-[66ch] text-[12.5px] leading-[1.7]">
        {labels.needPrivacy}
      </p>
    </DocSection>
  )
}

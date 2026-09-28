"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import {
  ClipboardListIcon,
  FilePenLineIcon,
  FileTextIcon,
  IdCardIcon,
  LogInIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { Button, ButtonLink } from "@/components/button"
import { Ask } from "@/components/doc/ask"
import { DocSection } from "@/components/doc/section"
import { Field } from "@/components/field"
import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { t, type Resolved } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { CLAIMS } from "@/features/claims/strings/claims"

/** Shape only — the server matches the address; this catches a missing `@` or domain. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Mirrors `MIN_ID_NUMBER_LENGTH` and the normalisation in `convex/model/identityHash.ts`. */
const MIN_ID_NUMBER_LENGTH = 4
const idLength = (raw: string) => raw.toUpperCase().replace(/[^0-9A-Z]/g, "").length

/**
 * The report form, below what to prepare. The checklist renders signed out
 * too: the one sentence that stops people stalling — you can't finish without
 * the death certificate — must be read before anyone makes an account.
 */
export function FileClaimForm() {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  const common = t(COMMON, locale)
  const router = useRouter()
  const submit = useMutation(api.claims.submit)

  const { isAuthenticated, isLoading } = useConvexAuth()
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip")

  const [idNumber, setIdNumber] = useState("")
  const [idTouched, setIdTouched] = useState(false)
  const [subjectEmail, setSubjectEmail] = useState("")
  const [emailTouched, setEmailTouched] = useState(false)
  // `null` until edited, so the account's name fills the field without an
  // effect racing the reader's typing.
  const [typedName, setTypedName] = useState<string | null>(null)
  const [contact, setContact] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const name = typedName ?? me?.name ?? ""
  const hasId = idNumber.trim().length > 0
  const hasEmail = subjectEmail.trim().length > 0
  const idValid = idLength(idNumber) >= MIN_ID_NUMBER_LENGTH
  const emailValid = EMAIL.test(subjectEmail.trim())
  // One route to the vault is enough, but whatever was typed must be usable.
  const ready =
    (idValid || emailValid) &&
    (!hasId || idValid) &&
    (!hasEmail || emailValid) &&
    name.trim().length > 0 &&
    contact.trim().length > 0

  async function file() {
    setBusy(true)
    setError(null)
    try {
      const { claimId } = await submit({
        subjectIdNumber: hasId ? idNumber.trim() : undefined,
        subjectEmail: hasEmail ? subjectEmail.trim().toLowerCase() : undefined,
        claimantName: name.trim(),
        claimantContact: contact.trim(),
      })
      router.push(`/case/${claimId}`)
    } catch (cause) {
      setError(refusalText(cause, labels))
      setBusy(false)
    }
    // No `finally`: on success the route is already changing, and clearing
    // `busy` would re-enable the button for the frame before it unmounts.
  }

  return (
    <div className="flex flex-col gap-6">
      <Checklist labels={labels} />

      {isLoading || !isAuthenticated ? (
        <Ask eyebrow={common.askEyebrow} title={labels.signInTitle} icon={LogInIcon}>
          <p className="text-foreground/75 max-w-[62ch] text-[15.5px] leading-[1.85]">{labels.signInBody}</p>
          <div>
            <ButtonLink href={`/sign-in?redirect_url=${encodeURIComponent("/file")}`} size="lg">
              {labels.signInAction}
            </ButtonLink>
          </div>
        </Ask>
      ) : (
        <Ask eyebrow={common.askEyebrow} title={labels.formTitle} icon={FilePenLineIcon}>
          <div className="flex flex-col gap-5">
            <Field
              label={labels.idLabel}
              hint={labels.idHint}
              error={idTouched && hasId && !idValid ? labels.idInvalid : undefined}
              value={idNumber}
              onChange={setIdNumber}
              onBlur={() => setIdTouched(true)}
              dir="ltr"
              autoComplete="off"
            />
            <Field
              label={labels.subjectLabel}
              hint={labels.subjectHint}
              error={emailTouched && hasEmail && !emailValid ? labels.subjectInvalid : undefined}
              value={subjectEmail}
              onChange={setSubjectEmail}
              onBlur={() => setEmailTouched(true)}
              type="email"
              dir="ltr"
              autoComplete="off"
              placeholder={labels.subjectPlaceholder}
            />
            <Field label={labels.nameLabel} value={name} onChange={setTypedName} autoComplete="name" />
            <Field
              label={labels.contactLabel}
              hint={labels.contactHint}
              value={contact}
              onChange={setContact}
              type="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder={labels.contactPlaceholder}
            />
          </div>

          <div className="border-border border-t pt-6">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => void file()} disabled={busy || !ready}>
              {busy ? labels.filing : labels.fileClaim}
            </Button>
            {error !== null && (
              <p role="alert" className="text-tone-attention mt-4 text-[14.5px] leading-[1.7]">
                {error}
              </p>
            )}
            <p className="text-muted-foreground mt-4 max-w-[62ch] text-[13px] leading-[1.75]">{labels.disclaimer}</p>
          </div>
        </Ask>
      )}
    </div>
  )
}

/** `claims.submit`'s typed refusals, in words; anything else is a failure worth retrying. */
function refusalText(cause: unknown, labels: Resolved<typeof CLAIMS>): string {
  if (cause instanceof ConvexError) {
    const data = cause.data as { code?: string; reason?: string }
    if (data.code === "claim" && data.reason === "rate_limited") return labels.fileRateLimited
    if (data.code === "claim" && data.reason === "own_vault") return labels.fileOwnVault
    if (data.code === "claim" && data.reason === "no_subject") return labels.fileNoSubject
    if (data.code === "claim" && data.reason === "bad_id_number") return labels.idInvalid
  }
  return labels.fileFailed
}

function Checklist({ labels }: { labels: Resolved<typeof CLAIMS> }) {
  const items = [
    { icon: FileTextIcon, title: labels.needCertificateTitle, body: labels.needCertificateBody },
    { icon: IdCardIcon, title: labels.needIdTitle, body: labels.needIdBody },
  ]

  return (
    <DocSection title={labels.needTitle} description={labels.needWhy} icon={ClipboardListIcon}>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.title} className="bg-background/60 border-border rounded-row flex flex-col gap-3 border p-4">
            <IconDisc icon={item.icon} tone="attention" size="sm" />
            <div>
              <p className="text-[15.5px] font-bold">{item.title}</p>
              <p className="text-foreground/70 mt-1 text-[13.5px] leading-[1.7]">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground flex items-start gap-2 text-[13px] leading-[1.7]">
        <ShieldCheckIcon className="text-tone-settled mt-0.5 size-4 shrink-0" strokeWidth={2.25} aria-hidden />
        {labels.needPrivacy}
      </p>
    </DocSection>
  )
}

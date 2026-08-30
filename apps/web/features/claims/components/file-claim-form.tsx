"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { useMutation } from "convex/react"

import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { Field } from "@/features/claims/components/field"
import { CLAIMS } from "@/features/claims/strings/claims"

/**
 * Filing a report: three fields and a button.
 *
 * ## Why it cannot navigate to the claim it just created
 *
 * `claims.submit` returns `{ received: true }` and nothing else — deliberately,
 * so it cannot be used to enumerate which email addresses have vaults. There is
 * no id to push to. So the form lands on `/claims`, where the new row appears
 * if one was created and does not if the email matched nothing, and the
 * confirmation copy is worded not to promise either way.
 *
 * That is also why there is no inline "we couldn't find that vault" error. The
 * mutation is not an oracle and this screen must not become one.
 */
export function FileClaimForm() {
  const locale = useLocale()
  const labels = t(CLAIMS, locale)
  const router = useRouter()
  const submit = useMutation(api.claims.submit)

  const [subjectEmail, setSubjectEmail] = useState("")
  const [name, setName] = useState("")
  const [contact, setContact] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const incomplete =
    subjectEmail.trim().length === 0 ||
    name.trim().length === 0 ||
    contact.trim().length === 0

  async function file() {
    setBusy(true)
    setError(null)
    try {
      await submit({
        subjectEmail: subjectEmail.trim().toLowerCase(),
        claimantName: name.trim(),
        claimantContact: contact.trim(),
      })
      router.push("/claims")
    } catch {
      setError(labels.fileFailed)
      setBusy(false)
    }
    // No `finally`: on success the route is already changing, and clearing
    // `busy` there would re-enable the button for the frame before it unmounts.
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
      <div className="flex flex-col gap-4">
        <Field
          label={labels.subjectLabel}
          hint={labels.subjectHint}
          value={subjectEmail}
          onChange={setSubjectEmail}
          type="email"
          dir="ltr"
        />
        <Field label={labels.nameLabel} value={name} onChange={setName} />
        <Field
          label={labels.contactLabel}
          hint={labels.contactHint}
          value={contact}
          onChange={setContact}
          type="tel"
          dir="ltr"
        />

        <button
          type="button"
          onClick={() => void file()}
          disabled={busy || incomplete}
          className="bg-primary text-primary-foreground hover:bg-terracotta-600 mt-1 self-start rounded-full px-8 py-3.5 text-[15px] font-semibold transition-colors disabled:opacity-50"
        >
          {busy ? labels.filing : labels.fileClaim}
        </button>

        {error !== null && (
          <p className="text-terracotta-800 text-[14px] leading-[1.7]">{error}</p>
        )}

        <p className="text-muted-foreground text-[12.5px] leading-[1.7]">
          {labels.disclaimer}
        </p>
      </div>

      <aside className="flex flex-col gap-4">
        <Panel title={labels.needTitle}>
          <p className="mb-4 text-[13.5px] leading-[1.65] opacity-70">
            {labels.needWhy}
          </p>
          <ul className="flex flex-col gap-4">
            <Need title={labels.needIdTitle} body={labels.needIdBody} />
            <Need
              title={labels.needCertificateTitle}
              body={labels.needCertificateBody}
            />
            <Need title={labels.needEmailTitle} body={labels.needEmailBody} />
          </ul>
        </Panel>

        <p className="text-muted-foreground px-1 text-[12.5px] leading-[1.7]">
          {labels.needPrivacy}
        </p>
      </aside>
    </div>
  )
}

function Need({ title, body }: { title: string; body: string }) {
  return (
    <li>
      <div className="text-[14.5px] font-semibold">{title}</div>
      <div className="mt-1 text-[13.5px] leading-[1.6] opacity-70">{body}</div>
    </li>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { useMutation } from "convex/react"
import {
  BadgeCheckIcon,
  FileTextIcon,
  MailIcon,
  ScaleIcon,
  ShieldIcon,
} from "lucide-react"

import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"
import { t, type Resolved } from "@/lib/i18n/locale"
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
 *
 * ## The form is a card, and the checklist is not
 *
 * Both were loose on the page ground and the whole screen was beige on beige,
 * with three input capsules floating in the middle of it. The form takes a
 * surface, a border and `--shadow-raised`, so it reads as one object with a
 * beginning and an end; the checklist beside it stays quieter and gains
 * hairlines, which is what turns three stacked pairs of lines into a list.
 *
 * ## The disabled button is surface-toned
 *
 * It was a faded primary, which AGENTS.md names directly: *"a disabled CTA is
 * surface-toned, never a faded primary."* Terracotta at half opacity over sand
 * is a muddy peach that reads as broken rather than as not-yet — and on this
 * screen the reader is three empty fields away from thinking the site is
 * broken anyway.
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

  const ready =
    subjectEmail.trim().length > 0 &&
    name.trim().length > 0 &&
    contact.trim().length > 0

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
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
      <section className="bg-card rounded-sheet border-border border p-6 shadow-[var(--shadow-raised)] md:p-8">
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
            <p className="text-terracotta-800 mt-4 text-[14px] leading-[1.7]">
              {error}
            </p>
          )}

          <p className="text-muted-foreground mt-4 flex items-start gap-2.5 text-[12.5px] leading-[1.7]">
            <ScaleIcon
              className="mt-0.5 size-4 shrink-0"
              strokeWidth={2.2}
              aria-hidden
            />
            {labels.disclaimer}
          </p>
        </div>
      </section>

      <Checklist labels={labels} />
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
    { icon: BadgeCheckIcon, title: labels.needIdTitle, body: labels.needIdBody },
    {
      icon: FileTextIcon,
      title: labels.needCertificateTitle,
      body: labels.needCertificateBody,
    },
    {
      icon: MailIcon,
      title: labels.needEmailTitle,
      body: labels.needEmailBody,
    },
  ]

  return (
    <aside className="rounded-sheet border-border border p-6 md:p-7">
      <h2 className="font-heading text-[16px] font-extrabold">
        {labels.needTitle}
      </h2>
      <p className="text-muted-foreground mt-2 text-[13px] leading-[1.65]">
        {labels.needWhy}
      </p>

      <ul className="mt-5 flex flex-col">
        {items.map((item, index) => (
          <li
            key={item.title}
            className={`flex gap-3.5 py-4 ${index === 0 ? "pt-0" : "border-border border-t"}`}
          >
            <span
              aria-hidden
              className="bg-card text-muted-foreground mt-0.5 grid size-8 shrink-0 place-items-center rounded-full"
            >
              <item.icon className="size-[17px]" strokeWidth={2.2} />
            </span>
            <div>
              <div className="text-[14px] font-semibold">{item.title}</div>
              <div className="text-muted-foreground mt-1 text-[13px] leading-[1.6]">
                {item.body}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground border-border mt-1 flex items-start gap-2.5 border-t pt-5 text-[12.5px] leading-[1.7]">
        <ShieldIcon
          className="mt-0.5 size-3.5 shrink-0"
          strokeWidth={2.2}
          aria-hidden
        />
        {labels.needPrivacy}
      </p>
    </aside>
  )
}

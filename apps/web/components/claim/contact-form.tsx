"use client"

import { useState } from "react"

import { Field } from "@/components/claim/field"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { CLAIM_SUPPORT } from "@/lib/i18n/strings/claim-support"

/**
 * The support form.
 *
 * **It does not send anything yet, and says so** rather than pretending. There
 * is no mail transport wired to this app — `RESEND_FROM` is unset on the
 * deployment and nothing on the web side has a send path — so a form that
 * accepted a message and showed a success state would be discarding it. On a
 * site whose readers have just been bereaved, silently dropping a request for
 * help is a worse failure than an honest notice.
 *
 * The fields are real so the shape is settled and so the page is usable the day
 * a transport lands; the notice is the only thing that will be deleted.
 */
export function ContactForm({ defaultRef }: { defaultRef: string }) {
  const labels = t(CLAIM_SUPPORT, useLocale())
  const [reference, setReference] = useState(defaultRef)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  return (
    <div className="mt-10 flex flex-col gap-5">
      <div className="border-border rounded-card border border-dashed p-4">
        <p className="text-sand-700 text-[14px] leading-[1.7]">
          {labels.contactSoon}
        </p>
        <a
          href="mailto:support@wassiya.app"
          className="text-terracotta-700 ltr-isolate mt-2 inline-block text-[15px] font-semibold hover:underline"
        >
          support@wassiya.app
        </a>
      </div>

      <Field
        label={labels.contactRefLabel}
        value={reference}
        onChange={setReference}
        dir="ltr"
        placeholder="C-0000"
      />
      <Field
        label={labels.contactEmailLabel}
        value={email}
        onChange={setEmail}
        type="email"
        dir="ltr"
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-sand-700 text-[13px]">
          {labels.contactMessageLabel}
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          className="bg-card rounded-card border-border border px-4 py-3 text-[15px] outline-none focus-visible:border-[color:var(--primary)]"
        />
      </label>

      <p className="text-sand-600 text-[12.5px] leading-[1.7]">
        {labels.contactNote}
      </p>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { looksLikeRecoveryCode } from "@workspace/crypto/papercode"
import { useMutation } from "convex/react"

import { Button } from "@/components/button"
import { Field } from "@/components/field"
import { useLocale } from "@/components/locale-provider"
import { supportError, supportRefusal } from "@/features/support/lib/errors"
import { MESSAGE_BOX } from "@/features/support/lib/message-box"
import { WEB_TOPICS, topicLabel, type Topic } from "@/features/support/lib/topics"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"

/**
 * Start a conversation. A guest gives a name and an email to be answered at;
 * a signed-in reader is known already, and may carry the report or delivery
 * they came from — the backend checks that it is theirs.
 */
export function NewThreadForm({
  signedIn,
  guestToken,
  initialTopic,
  claimId,
  deliveryId,
}: {
  signedIn: boolean
  guestToken: string | undefined
  initialTopic: Topic
  claimId?: Id<"claims">
  deliveryId?: Id<"deliveries">
}) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const router = useRouter()
  const start = useMutation(api.support.threads.start)
  const [topic, setTopic] = useState<Topic>(initialTopic)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sheetInText = looksLikeRecoveryCode(body)
  const detailsOk =
    signedIn || (name.trim().length > 0 && email.includes("@"))
  const canSend = !busy && !sheetInText && body.trim().length > 0 && detailsOk

  async function submit() {
    if (!canSend) return
    setBusy(true)
    setError(null)
    const args = {
      guestToken,
      guestName: signedIn ? undefined : name,
      guestEmail: signedIn ? undefined : email,
      surface: "web" as const,
      topic,
      locale,
      body,
      attachments: [],
    }
    try {
      const withContext = signedIn && (claimId ?? deliveryId) !== undefined
      // A forwarded case link may not be the reader's own case; the backend
      // refuses that context, and the question is still worth asking without it.
      const threadId = withContext
        ? await start({ ...args, claimId, deliveryId }).catch((cause) => {
            if (supportRefusal(cause) !== "context") throw cause
            return start(args)
          })
        : await start(args)
      router.push(`/help/chat/${threadId}`)
    } catch (cause) {
      setError(supportError(cause, locale))
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {!signedIn && (
        <>
          <Field label={labels.name} value={name} onChange={setName} />
          <Field
            label={labels.email}
            value={email}
            onChange={setEmail}
            type="email"
            dir="ltr"
            hint={labels.emailHint}
          />
        </>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold">{labels.topic}</span>
        <div className="flex flex-wrap gap-2">
          {WEB_TOPICS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTopic(key)}
              aria-pressed={topic === key}
              className={
                topic === key
                  ? "bg-primary text-primary-foreground h-10 rounded-full border border-transparent px-4 text-[14px] font-semibold"
                  : "bg-background border-border hover:bg-foreground/[0.04] h-10 rounded-full border px-4 text-[14px] font-semibold transition-colors"
              }
            >
              {topicLabel(key, locale)}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold">{labels.message}</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={labels.messagePlaceholder}
          rows={5}
          className={MESSAGE_BOX}
          aria-invalid={sheetInText || undefined}
        />
      </label>
      {sheetInText && (
        <p role="alert" className="text-tone-attention text-[13.5px] font-semibold">
          {labels.recoveryWarning}
        </p>
      )}
      {error !== null && (
        <p role="alert" className="text-tone-attention text-[13.5px]">
          {error}
        </p>
      )}

      <div className="border-border flex flex-col items-start gap-3 border-t pt-6">
        <Button size="lg" onClick={submit} disabled={!canSend}>
          {busy ? labels.sending : labels.send}
        </Button>
        <p className="text-muted-foreground text-[13px] leading-[1.7]">
          {labels.attachLater} {labels.guardrail}
        </p>
      </div>
    </div>
  )
}

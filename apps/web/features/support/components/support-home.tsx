"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { useMutation } from "convex/react"
import { LogInIcon, MessageSquarePlusIcon } from "lucide-react"

import { DocSection } from "@/components/doc/section"
import { useLocale } from "@/components/locale-provider"
import { Placeholder } from "@/components/placeholder"
import { COMMON } from "@/lib/i18n/strings/common"
import { NewThreadForm } from "@/features/support/components/new-thread-form"
import { ThreadList } from "@/features/support/components/thread-list"
import { isTopic } from "@/features/support/lib/topics"
import { useSupportIdentity } from "@/features/support/lib/use-support-identity"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"

/**
 * `/help/chat`: the reader's conversations and a form to start one.
 *
 * `?resume=` is the single-use link from a guest's reply email; it moves the
 * thread to this browser and opens it. `?topic=`, `?claim=` and `?delivery=`
 * are set by the "need help?" links on a report or a delivery.
 */
export function SupportHome() {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const params = useSearchParams()
  const identity = useSupportIdentity()

  const resumeToken = params.get("resume")
  if (resumeToken !== null) {
    return identity.ready && identity.guestToken !== undefined ? (
      <Resume resumeToken={resumeToken} guestToken={identity.guestToken} />
    ) : identity.ready ? (
      <p className="bg-card border-border rounded-card text-foreground/80 border p-6 text-[15.5px] leading-[1.8]">{labels.resumeSignedIn}</p>
    ) : null
  }

  const rawTopic = params.get("topic")
  const topic = isTopic(rawTopic) ? rawTopic : "other"
  const claimId = params.get("claim") ?? undefined
  const deliveryId = params.get("delivery") ?? undefined

  if (!identity.ready) return <Placeholder label={t(COMMON, locale).loading} className="h-72" />

  return (
    <div className="flex flex-col gap-8">
      <ThreadList guestToken={identity.guestToken} />

      <DocSection title={labels.newChat} icon={MessageSquarePlusIcon}>
        {!identity.signedIn && (
          <p className="bg-background/70 border-border rounded-row flex flex-wrap items-center gap-x-3 gap-y-2 border px-4 py-3 text-[14px]">
            <LogInIcon className="text-muted-foreground size-4 shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="text-foreground/75 min-w-0 flex-1">{labels.signInHint}</span>
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent("/help/chat")}`}
              className="text-surface-accent-ink font-bold underline underline-offset-4"
            >
              {labels.signIn}
            </Link>
          </p>
        )}
        <NewThreadForm
          signedIn={identity.signedIn}
          guestToken={identity.guestToken}
          initialTopic={topic}
          claimId={claimId as Id<"claims"> | undefined}
          deliveryId={deliveryId as Id<"deliveries"> | undefined}
        />
      </DocSection>
    </div>
  )
}

function Resume({
  resumeToken,
  guestToken,
}: {
  resumeToken: string
  guestToken: string
}) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const router = useRouter()
  const resume = useMutation(api.support.threads.resume)
  const [failed, setFailed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    resume({ resumeToken, guestToken })
      .then((threadId) => router.replace(`/help/chat/${threadId}`))
      .catch(() => setFailed(true))
  }, [resumeToken, guestToken, resume, router])

  return (
    <p className="bg-card border-border rounded-card text-foreground/80 border p-6 text-[15.5px] leading-[1.8]">
      {failed ? labels.resumeFailed : labels.resuming}
    </p>
  )
}

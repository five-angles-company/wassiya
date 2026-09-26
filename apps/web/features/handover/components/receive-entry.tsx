"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { LinkIcon, LogInIcon, MailOpenIcon, ShieldAlertIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { Ask } from "@/components/doc/ask"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { NoticeCard } from "@/components/notice-card"
import { Placeholder } from "@/components/placeholder"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { DELIVERY } from "@/features/handover/strings/delivery"

/**
 * The link from our message to an executor. Signed in, it binds the delivery to
 * the account on its own and moves on; signed out, it offers a way in.
 *
 * ⚠️ It names nobody. A recycled number or address can put this page in front
 * of a stranger, who must learn no more than that something waits for someone.
 */
export function ReceiveEntry({ token }: { token: string }) {
  const router = useRouter()
  const locale = useLocale()
  const labels = t(DELIVERY, locale)
  const common = t(COMMON, locale)
  const { isAuthenticated, isLoading } = useConvexAuth()
  const info = useQuery(api.deliveries.byToken, { token })
  const bind = useMutation(api.deliveries.bind)
  const [failed, setFailed] = useState(false)
  const sent = useRef(false)

  const canBind = isAuthenticated && info !== undefined && info !== null && info.open

  useEffect(() => {
    if (!canBind || sent.current) return
    sent.current = true
    bind({ token })
      .then(({ deliveryId }) => router.replace(`/delivery/${deliveryId}`))
      .catch(() => setFailed(true))
  }, [canBind, bind, token, router])

  if (info === undefined || isLoading) return <Placeholder label={common.loading} className="h-72" />

  if (info === null || !info.open) {
    return <NoticeCard icon={LinkIcon} title={labels.receiveMissing} body={labels.receiveMissingBody} headingLevel="h1" />
  }

  return (
    <article className="flex flex-col gap-6">
      <DocTitle
        eyebrow={labels.receiveEyebrow}
        eyebrowIcon={MailOpenIcon}
        title={labels.receiveTitleUnknown}
        lead={labels.receiveBody}
      />

      <div className="mt-4">
        <Ask eyebrow={common.askEyebrow} title={labels.receiveNextTitle} icon={LogInIcon}>
          {!isAuthenticated ? (
            <div>
              <ButtonLink href={`/sign-in?redirect_url=${encodeURIComponent(`/receive/${token}`)}`} size="lg">
                {labels.receiveSignIn}
              </ButtonLink>
            </div>
          ) : failed ? (
            <p className="text-tone-attention max-w-[62ch] text-[15px] leading-[1.75] font-semibold">
              {labels.receiveBindFailed}
            </p>
          ) : (
            <p className="text-muted-foreground text-[15px]">{labels.receiveBinding}</p>
          )}
        </Ask>
      </div>

      <p className="bg-tone-attention-soft text-tone-attention rounded-row flex items-start gap-3 px-5 py-4 text-[14.5px] leading-[1.75] font-semibold">
        <ShieldAlertIcon className="mt-0.5 size-5 shrink-0" strokeWidth={2.25} aria-hidden />
        {labels.receiveWarning}
      </p>
    </article>
  )
}

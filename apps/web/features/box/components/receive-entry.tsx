"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@workspace/backend/api"
import { useConvexAuth, useMutation, useQuery } from "convex/react"

import { ButtonLink } from "@/components/button"
import { Prose } from "@/components/doc/prose"
import { SetApart } from "@/components/doc/set-apart"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { DELIVERY } from "@/features/box/strings/delivery"

/**
 * The link an heir was sent.
 *
 * Readable signed out, because the person holding it usually has no account
 * yet. Once Convex sees a signed-in reader it binds the delivery to them and
 * moves on — binding opens nothing; the identity match on the next page does.
 * Gated on Convex's auth state, not Clerk's: `bind` is a Convex mutation and
 * would fail in the window where Clerk is ready and Convex is not.
 */
export function ReceiveEntry({ token }: { token: string }) {
  const router = useRouter()
  const labels = t(DELIVERY, useLocale())
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

  if (info === undefined || isLoading) {
    return <div className="border-border h-40 animate-pulse border-y" aria-hidden />
  }

  if (info === null || !info.open) {
    return (
      <article className="flex flex-col gap-4">
        <DocTitle title={labels.receiveMissing} />
        <Prose>
          <p>{labels.receiveMissingBody}</p>
        </Prose>
      </article>
    )
  }

  const title =
    info.subjectName === null
      ? labels.receiveTitleUnknown
      : labels.receiveTitle.replace("{name}", info.subjectName)

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <DocTitle title={title} />
        <Prose>
          <p>{labels.receiveBody}</p>
        </Prose>
      </div>

      <SetApart className="flex flex-col gap-4">
        {!isAuthenticated ? (
          <div>
            <ButtonLink
              href={`/sign-in?redirect_url=${encodeURIComponent(`/receive/${token}`)}`}
              size="lg"
            >
              {labels.receiveSignIn}
            </ButtonLink>
          </div>
        ) : failed ? (
          <p className="text-tone-attention max-w-[66ch] text-[14px] leading-[1.65]">
            {labels.receiveBindFailed}
          </p>
        ) : (
          <p className="text-muted-foreground text-[14px]">{labels.receiveBinding}</p>
        )}
      </SetApart>
    </article>
  )
}

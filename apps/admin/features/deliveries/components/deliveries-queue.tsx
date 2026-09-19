"use client"

import { useMemo, useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { useLocale } from "@/components/locale-provider"
import { DELIVERIES } from "@/features/deliveries/strings/deliveries"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"

type Status = "awaiting_heir" | "identity_pending" | "ready" | "rejected" | "expired"

const TABS: readonly { status: Status; label: keyof typeof DELIVERIES }[] = [
  { status: "identity_pending", label: "tabIdentity" },
  { status: "awaiting_heir", label: "tabAwaiting" },
  { status: "ready", label: "tabReady" },
  { status: "rejected", label: "tabRejected" },
  { status: "expired", label: "tabExpired" },
]

/**
 * The two jobs a person still does on a delivery: sending the heir their link
 * by hand, and deciding an identity the registered ID number could not.
 *
 * Identity review opens first because it is the one an heir is actively
 * waiting on. Approval is refused server-side unless the bound person is
 * Didit-verified; this screen only lays the two records side by side.
 */
export function DeliveriesQueue() {
  const locale = useLocale()
  const labels = useMemo(() => t(DELIVERIES, locale), [locale])
  const [status, setStatus] = useState<Status>("identity_pending")
  const rows = useQuery(api.deliveries.adminList, { status })
  const markContacted = useMutation(api.deliveries.adminMarkContacted)
  const decide = useMutation(api.deliveries.adminDecideIdentity)

  async function run(action: Promise<unknown>, success: string) {
    try {
      await action
      toast.success(success)
    } catch {
      toast.error(labels.failed)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-muted-foreground">{labels.intro}</p>

      <Tabs value={status} onValueChange={(value) => setStatus(value as Status)}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.status} value={tab.status}>
              {labels[tab.label]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {rows === undefined ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{labels.empty}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <Card key={row.deliveryId}>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="font-semibold">
                      {row.heir.name ?? "—"}
                      {row.heir.relation !== null && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {row.heir.relation}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {labels.from.replace("{name}", row.subjectName ?? "—")}
                      {row.heir.phone !== null && (
                        <span dir="ltr"> · {row.heir.phone}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {labels.expires.replace("{date}", fmtDate(row.expiresAt, locale))}
                  </span>
                </div>

                {status === "awaiting_heir" && (
                  <LinkRow
                    link={row.link}
                    contactedAt={row.contactedAt}
                    labels={labels}
                    locale={locale}
                    onSent={() =>
                      void run(
                        markContacted({ deliveryId: row.deliveryId }),
                        labels.sentOn.replace("{date}", fmtDate(Date.now(), locale))
                      )
                    }
                  />
                )}

                {status === "identity_pending" && (
                  <IdentityCompare
                    row={row}
                    labels={labels}
                    onDecide={(approve) =>
                      void run(
                        decide({ deliveryId: row.deliveryId as Id<"deliveries">, approve }),
                        approve ? labels.approved : labels.rejected
                      )
                    }
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

type Labels = ReturnType<typeof t<typeof DELIVERIES>>

function LinkRow({
  link,
  contactedAt,
  labels,
  locale,
  onSent,
}: {
  link: string | null
  contactedAt: number | null
  labels: Labels
  locale: "ar" | "en"
  onSent: () => void
}) {
  if (link === null) {
    return <p className="text-sm text-destructive">{labels.noAppUrl}</p>
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{labels.link}</span>
      <code dir="ltr" className="break-all rounded-md bg-muted px-3 py-2 text-xs">
        {link}
      </code>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void navigator.clipboard
              .writeText(link)
              .then(() => toast.success(labels.copied))
          }
        >
          {labels.copy}
        </Button>
        {contactedAt === null ? (
          <Button size="sm" onClick={onSent}>
            {labels.markSent}
          </Button>
        ) : (
          <Badge variant="secondary">
            {labels.sentOn.replace("{date}", fmtDate(contactedAt, locale))}
          </Badge>
        )}
      </div>
    </div>
  )
}

function IdentityCompare({
  row,
  labels,
  onDecide,
}: {
  row: {
    heir: { name: string | null; birthDate: string | null; hasIdNumber: boolean }
    boundPerson: {
      verifiedName: string | null
      birthDate: string | null
      identityStatus: string
      idNumberMatches: boolean
    } | null
  }
  labels: Labels
  onDecide: (approve: boolean) => void
}) {
  const bound = row.boundPerson
  const verified = bound?.identityStatus === "verified"
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <dl className="flex flex-col gap-1 text-sm">
          <dt className="text-xs font-medium text-muted-foreground">{labels.heirRecord}</dt>
          <dd className="font-medium">{row.heir.name ?? "—"}</dd>
          <dd>
            {labels.birthDate}: <span dir="ltr">{row.heir.birthDate ?? "—"}</span>
          </dd>
          <dd>
            {labels.idNumber}: {row.heir.hasIdNumber ? labels.idRegistered : labels.idNone}
          </dd>
        </dl>
        <dl className="flex flex-col gap-1 text-sm">
          <dt className="text-xs font-medium text-muted-foreground">{labels.boundPerson}</dt>
          {bound === null ? (
            <dd className="text-muted-foreground">{labels.noBound}</dd>
          ) : (
            <>
              <dd className="font-medium">
                {labels.verifiedName}: {bound.verifiedName ?? "—"}
              </dd>
              <dd>
                {labels.birthDate}: <span dir="ltr">{bound.birthDate ?? "—"}</span>
              </dd>
              {row.heir.hasIdNumber && (
                <dd>{bound.idNumberMatches ? labels.idMatches : labels.idNoMatch}</dd>
              )}
              {!verified && <dd className="text-destructive">{labels.notVerified}</dd>}
            </>
          )}
        </dl>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={!verified} onClick={() => onDecide(true)}>
          {labels.approve}
        </Button>
        <Button size="sm" variant="outline" disabled={bound === null} onClick={() => onDecide(false)}>
          {labels.reject}
        </Button>
      </div>
    </div>
  )
}

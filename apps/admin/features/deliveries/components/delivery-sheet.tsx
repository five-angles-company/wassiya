"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import type { FunctionReturnType } from "convex/server"
import { useMutation, useQuery } from "convex/react"
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ClockIcon,
  CopyIcon,
  ExternalLinkIcon,
  MailIcon,
  MessageSquareIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmAction } from "@/components/confirm-action"
import {
  MANUAL_CHANNELS,
  MANUAL_OUTCOMES,
  channelLabel,
  outcomeLabel,
  statusLabel,
  statusVariant,
  type ContactChannel,
  type ContactOutcome,
} from "@/features/deliveries/lib/labels"
import { DELIVERIES } from "@/features/deliveries/strings/deliveries"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

type Detail = NonNullable<FunctionReturnType<typeof api.deliveries.adminDetail>>
type Labels = ReturnType<typeof t<typeof DELIVERIES>>

/**
 * One delivery, worked beside the table.
 *
 * Read top to bottom it answers four questions in the order staff ask them:
 * what needs doing, is this the right person, how do we reach them, and what
 * has been tried. Only the section that needs a decision carries weight — a
 * settled delivery shows the same sections, quietly.
 */
export function DeliverySheet({
  deliveryId,
  locale,
  onClose,
}: {
  deliveryId: Id<"deliveries"> | null
  locale: Locale
  onClose: () => void
}) {
  const labels = t(DELIVERIES, locale)
  const detail = useQuery(
    api.deliveries.adminDetail,
    deliveryId === null ? "skip" : { deliveryId }
  )

  return (
    <Sheet open={deliveryId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl"
      >
        {detail === undefined || detail === null ? (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div key={detail.deliveryId}>
            <SheetHeader className="gap-1.5 border-b p-6">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="font-heading text-xl">
                  {detail.heir.name ?? "—"}
                </SheetTitle>
                <Badge variant={statusVariant(detail.status)}>
                  {statusLabel(detail.status, locale)}
                </Badge>
              </div>
              <SheetDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{detail.heir.relation}</span>
                <Dot />
                <span>{detail.subjectName ?? "—"}</span>
                <Dot />
                <span>
                  {labels.closesOn.replace("{date}", fmtDate(detail.expiresAt, locale))}
                </span>
                <Link
                  href={`/claims/${detail.claimId}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLinkIcon className="size-3" />
                  {labels.openReport}
                </Link>
              </SheetDescription>
            </SheetHeader>

            <StatusCallout detail={detail} labels={labels} />

            <div className="divide-y">
              <IdentitySection detail={detail} labels={labels} />
              <ContactSection detail={detail} labels={labels} />
              <TimelineSection detail={detail} labels={labels} locale={locale} />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Dot() {
  return <span aria-hidden>·</span>
}

/** The one line that says what to do now, in the tone the state deserves. */
function StatusCallout({ detail, labels }: { detail: Detail; labels: Labels }) {
  const [text, tone, Icon] = (() => {
    switch (detail.status) {
      case "awaiting_heir":
        return detail.timeline.some(
          (row) => row.outcome === "sent" || row.outcome === "reached"
        )
          ? ([labels.nextWaitOpen, "waiting", ClockIcon] as const)
          : ([labels.nextSend, "action", TriangleAlertIcon] as const)
      case "identity_pending":
        return detail.boundPerson?.identityStatus === "verified"
          ? ([labels.nextDecide, "action", TriangleAlertIcon] as const)
          : ([labels.nextWaitVerify, "waiting", ClockIcon] as const)
      case "ready":
        return [labels.nextReady, "done", CheckCircle2Icon] as const
      case "rejected":
        return [labels.nextRejected, "bad", XCircleIcon] as const
      case "expired":
        return [labels.nextExpired, "waiting", ClockIcon] as const
    }
  })()

  return (
    <p
      className={cn(
        "flex items-start gap-2.5 px-6 py-4 text-sm leading-relaxed",
        tone === "action" && "bg-primary/10 text-foreground",
        tone === "done" && "bg-secondary/15 text-foreground",
        tone === "bad" && "bg-destructive/10 text-foreground",
        tone === "waiting" && "bg-muted/60 text-muted-foreground"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "action" && "text-primary",
          tone === "done" && "text-secondary",
          tone === "bad" && "text-destructive"
        )}
      />
      {text}
    </p>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 p-6">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

/**
 * The comparison, and it *judges*: every row says match, differs, or nothing to
 * compare. A grid of four values with no verdict is the reviewer's work left
 * undone, and the disagreement is what they are looking for.
 */
function IdentitySection({ detail, labels }: { detail: Detail; labels: Labels }) {
  const decide = useMutation(api.deliveries.adminDecideIdentity)
  const bound = detail.boundPerson
  const pending = detail.status === "identity_pending" && bound?.identityStatus === "verified"

  async function rule(approve: boolean) {
    try {
      await decide({ deliveryId: detail.deliveryId, approve })
      toast.success(approve ? labels.nextReady : labels.nextRejected)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.failed)
    }
  }

  const idVerdict: Verdict =
    !detail.heir.hasIdNumber || bound === null
      ? "unknown"
      : bound.idNumberMatches
        ? "yes"
        : "no"
  const birthVerdict: Verdict =
    detail.heir.birthDate === null || bound?.birthDate == null
      ? "unknown"
      : detail.heir.birthDate === bound.birthDate
        ? "yes"
        : "no"

  return (
    <Section
      title={labels.identityTitle}
      action={
        detail.identityMatch !== null ? (
          <span className="text-xs text-muted-foreground">
            {detail.identityMatch === "id_number" ? labels.matchedById : labels.approvedByStaff}
          </span>
        ) : undefined
      }
    >
      {bound === null ? (
        <p className="text-sm text-muted-foreground">{labels.notBound}</p>
      ) : (
        <div className="flex flex-col divide-y">
          <CompareRow
            label={labels.name}
            left={detail.heir.name ?? labels.none}
            right={bound.verifiedName ?? labels.none}
            verdict="unknown"
            labels={labels}
          />
          <CompareRow
            label={labels.birthDate}
            left={detail.heir.birthDate ?? labels.none}
            right={bound.birthDate ?? labels.none}
            verdict={birthVerdict}
            numeric
            labels={labels}
          />
          <CompareRow
            label={labels.idNumber}
            left={detail.heir.hasIdNumber ? labels.idRegistered : labels.idNone}
            right={
              !detail.heir.hasIdNumber
                ? labels.none
                : bound.idNumberMatches
                  ? labels.idMatches
                  : labels.idNoMatch
            }
            verdict={idVerdict}
            labels={labels}
          />
        </div>
      )}

      {bound !== null && bound.identityStatus !== "verified" && (
        <p className="text-sm text-muted-foreground">{labels.notVerifiedYet}</p>
      )}

      {pending && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <ConfirmAction
            title={labels.approveTitle}
            body={labels.approveBody}
            confirmLabel={labels.approve}
            cancelLabel={labels.cancel}
            onConfirm={() => rule(true)}
            trigger={<Button className="w-full">{labels.approve}</Button>}
          />
          <ConfirmAction
            tone="destructive"
            title={labels.rejectTitle}
            body={labels.rejectBody}
            confirmLabel={labels.reject}
            cancelLabel={labels.cancel}
            onConfirm={() => rule(false)}
            trigger={
              <Button variant="outline" className="w-full text-destructive">
                {labels.reject}
              </Button>
            }
          />
        </div>
      )}
    </Section>
  )
}

type Verdict = "yes" | "no" | "unknown"

function CompareRow({
  label,
  left,
  right,
  verdict,
  numeric = false,
  labels,
}: {
  label: string
  left: string
  right: string
  verdict: Verdict
  numeric?: boolean
  labels: Labels
}) {
  return (
    <div className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {verdict !== "unknown" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              verdict === "yes" ? "text-secondary" : "text-destructive"
            )}
          >
            {verdict === "yes" ? (
              <CheckCircle2Icon className="size-3.5" />
            ) : (
              <XCircleIcon className="size-3.5" />
            )}
            {verdict === "yes" ? labels.matchYes : labels.matchNo}
          </span>
        )}
      </div>
      {/* Stacked, each carrying whose value it is — a two-column grid made the
          reader match cells to headers before reading either. */}
      <Value caption={labels.registered} value={left} numeric={numeric} />
      <Value
        caption={labels.verified}
        value={right}
        numeric={numeric}
        tone={verdict === "no" ? "bad" : undefined}
      />
    </div>
  )
}

function Value({
  caption,
  value,
  numeric = false,
  tone,
}: {
  caption: string
  value: string
  numeric?: boolean
  tone?: "bad"
}) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="text-xs text-muted-foreground">{caption}</span>
      <span
        className={cn("font-medium", numeric && "tabular-nums", tone === "bad" && "text-destructive")}
        dir={numeric ? "ltr" : undefined}
      >
        {value}
      </span>
    </p>
  )
}

function ContactSection({ detail, labels }: { detail: Detail; labels: Labels }) {
  const update = useMutation(api.deliveries.adminUpdateContact)
  const resend = useMutation(api.deliveries.adminResend)
  const reissue = useMutation(api.deliveries.adminReissueLink)
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(detail.contact.phone ?? "")
  const [email, setEmail] = useState(detail.contact.email ?? "")
  const open = detail.status === "awaiting_heir" || detail.status === "identity_pending"
  const canReissue = detail.status !== "ready" && detail.status !== "expired"

  async function run(action: Promise<unknown>, success: string) {
    try {
      await action
      toast.success(success)
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.failed)
      return false
    }
  }

  async function save() {
    const ok = await run(
      update({ deliveryId: detail.deliveryId, phone: phone.trim(), email: email.trim() }),
      labels.saveContact
    )
    if (ok) setEditing(false)
  }

  return (
    <Section
      title={labels.contactTitle}
      action={
        !editing && detail.status !== "expired" ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            {labels.editContact}
          </Button>
        ) : undefined
      }
    >
      {editing ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">{labels.phone}</span>
            <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <span className="text-xs text-muted-foreground">{labels.phoneHint}</span>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted-foreground">{labels.email}</span>
            <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void save()}>
              {labels.saveContact}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {labels.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col divide-y">
          <ContactRow
            icon={<MessageSquareIcon className="size-4 text-muted-foreground" />}
            label={labels.phone}
            value={detail.contact.phone}
            overridden={detail.contact.phoneOverridden}
            overriddenLabel={labels.updatedByStaff}
            none={labels.none}
            action={
              open && detail.contact.phone !== null ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void run(
                      resend({ deliveryId: detail.deliveryId, channel: "sms" }),
                      labels.sent
                    )
                  }
                >
                  {labels.sendSms}
                </Button>
              ) : undefined
            }
          />
          <ContactRow
            icon={<MailIcon className="size-4 text-muted-foreground" />}
            label={labels.email}
            value={detail.contact.email}
            overridden={detail.contact.emailOverridden}
            overriddenLabel={labels.updatedByStaff}
            none={labels.none}
            action={
              open && detail.contact.email !== null ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void run(
                      resend({ deliveryId: detail.deliveryId, channel: "email" }),
                      labels.sent
                    )
                  }
                >
                  {labels.sendEmail}
                </Button>
              ) : undefined
            }
          />
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <span className="text-xs text-muted-foreground">{labels.link}</span>
          {detail.link === null ? (
            <p className="text-sm text-destructive">{labels.noAppUrl}</p>
          ) : (
            <>
              <code dir="ltr" className="line-clamp-2 break-all text-xs">
                {detail.link}
              </code>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(detail.link!)
                      .then(() => toast.success(labels.copied))
                  }
                >
                  <CopyIcon />
                  {labels.copy}
                </Button>
                {canReissue && (
                  <ConfirmAction
                    tone="destructive"
                    title={labels.reissueTitle}
                    body={labels.reissueBody}
                    confirmLabel={labels.reissue}
                    cancelLabel={labels.cancel}
                    onConfirm={async () => {
                      await run(reissue({ deliveryId: detail.deliveryId }), labels.reissued)
                    }}
                    trigger={
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <RotateCcwIcon />
                        {labels.reissue}
                      </Button>
                    }
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Section>
  )
}

function ContactRow({
  icon,
  label,
  value,
  overridden,
  overriddenLabel,
  none,
  action,
}: {
  icon: ReactNode
  label: string
  value: string | null
  overridden: boolean
  overriddenLabel: string
  none: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      {icon}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span dir="ltr" className="truncate text-start text-sm font-medium">
          {value ?? none}
        </span>
      </div>
      {overridden && (
        <Badge variant="outline" className="shrink-0">
          {overriddenLabel}
        </Badge>
      )}
      {action}
    </div>
  )
}

/**
 * What has been tried, and the form to add to it. The form is folded away:
 * most visits to a delivery are to read its state, not to write to it.
 */
function TimelineSection({
  detail,
  labels,
  locale,
}: {
  detail: Detail
  labels: Labels
  locale: Locale
}) {
  const [logging, setLogging] = useState(false)

  return (
    <Section
      title={labels.timelineTitle}
      action={
        detail.status === "expired" ? undefined : (
          <Button variant="ghost" size="sm" onClick={() => setLogging((was) => !was)}>
            {logging ? labels.logClose : labels.logToggle}
            <ChevronDownIcon className={cn("transition-transform", logging && "rotate-180")} />
          </Button>
        )
      }
    >
      {logging && (
        <LogAttempt
          deliveryId={detail.deliveryId}
          labels={labels}
          locale={locale}
          onDone={() => setLogging(false)}
        />
      )}

      {detail.timeline.length === 0 ? (
        <p className="text-sm text-muted-foreground">{labels.timelineEmpty}</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {detail.timeline.map((row) => (
            <li key={row.id} className="relative flex flex-col gap-0.5 ps-5 text-sm">
              <span
                aria-hidden
                className={cn(
                  "absolute start-0 top-1.5 size-2 rounded-full",
                  row.outcome === "failed" || row.outcome === "wrong_person"
                    ? "bg-destructive"
                    : row.outcome === "reached"
                      ? "bg-secondary"
                      : "bg-muted-foreground/40"
                )}
              />
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{channelLabel(row.channel, locale)}</span>
                <span className="text-muted-foreground">
                  {outcomeLabel(row.outcome, locale)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmtDate(row.at, locale)} · {row.staffName ?? labels.automatic}
                </span>
              </div>
              {row.note !== null && <p className="text-muted-foreground">{row.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </Section>
  )
}

function LogAttempt({
  deliveryId,
  labels,
  locale,
  onDone,
}: {
  deliveryId: Id<"deliveries">
  labels: Labels
  locale: Locale
  onDone: () => void
}) {
  const log = useMutation(api.deliveries.adminLogContact)
  const [channel, setChannel] = useState<ContactChannel>("call")
  const [outcome, setOutcome] = useState<ContactOutcome>("reached")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      await log({ deliveryId, channel, outcome, note: note.trim() || undefined })
      toast.success(labels.logged)
      setNote("")
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 pb-1">
      <div className="grid grid-cols-2 gap-2">
        <Select value={channel} onValueChange={(value) => setChannel(value as ContactChannel)}>
          <SelectTrigger className="w-full" aria-label={labels.channel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MANUAL_CHANNELS.map((value) => (
              <SelectItem key={value} value={value}>
                {channelLabel(value, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={outcome} onValueChange={(value) => setOutcome(value as ContactOutcome)}>
          <SelectTrigger className="w-full" aria-label={labels.outcome}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MANUAL_OUTCOMES.map((value) => (
              <SelectItem key={value} value={value}>
                {outcomeLabel(value, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={labels.notePlaceholder}
        aria-label={labels.note}
        rows={2}
        className="min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      <Button size="sm" className="self-start" disabled={busy} onClick={() => void save()}>
        {labels.logSave}
      </Button>
    </div>
  )
}

"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import type { FunctionReturnType } from "convex/server"
import { useMutation, useQuery } from "convex/react"
import { ExternalLinkIcon } from "lucide-react"
import { toast } from "sonner"

import { IdentityBadge } from "@/components/identity-badge"
import { useLocale } from "@/components/locale-provider"
import { usePermissions } from "@/hooks/use-permissions"
import { errorMessage } from "@/features/support/lib/labels"
import { SUPPORT } from "@/features/support/strings/support"
import { fmtAgo } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import type { IdentityStatus } from "@/lib/identity"

type Thread = NonNullable<
  FunctionReturnType<typeof api.support.admin.adminThread>
>

const NOBODY = "__nobody__"

/**
 * Who is asking and what it is about — only what is already bound to the
 * requester's own account. A guest gets a warning instead of a link: their
 * email is what they typed, and staff must not confirm a vault exists.
 */
export function ThreadContext({ thread }: { thread: Thread }) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const { has } = usePermissions()
  const { requester } = thread

  return (
    <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-4 text-sm">
      <Section title={labels.requester}>
        <p className="font-medium">{requester.name ?? "—"}</p>
        <p dir="ltr" className="text-start text-muted-foreground">
          {requester.email ?? "—"}
        </p>
        {requester.kind === "guest" ? (
          <p className="mt-2 rounded-lg bg-muted p-2 text-xs text-muted-foreground">
            {labels.guestUnverified}
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{labels.account}</Badge>
            {requester.identityStatus !== null && (
              <IdentityBadge
                status={requester.identityStatus as IdentityStatus}
                locale={locale}
              />
            )}
            {has("owners.read") && requester.userId !== null && (
              <ContextLink href={`/owners/${requester.userId}`}>
                {labels.openAccount}
              </ContextLink>
            )}
          </div>
        )}
      </Section>

      {(thread.claimId !== null || thread.deliveryId !== null) && (
        <Section title={labels.context}>
          {thread.claimId !== null && has("claims.read") && (
            <ContextLink href={`/claims/${thread.claimId}`}>
              {labels.openReport}
            </ContextLink>
          )}
          {thread.deliveryId !== null && has("deliveries.read") && (
            <ContextLink href="/deliveries">{labels.openDeliveries}</ContextLink>
          )}
        </Section>
      )}

      <Section title={labels.assignee}>
        <Assignment thread={thread} />
      </Section>

      <StatusAction thread={thread} />

      <Section title={labels.notes}>
        <Notes thread={thread} />
      </Section>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function ContextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      <ExternalLinkIcon className="size-3" />
      {children}
    </Link>
  )
}

function Assignment({ thread }: { thread: Thread }) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const { has } = usePermissions()
  const me = useQuery(api.staff.me)
  const assignees = useQuery(
    api.support.admin.adminAssignees,
    has("support.manage") ? {} : "skip"
  )
  const assign = useMutation(api.support.admin.adminAssign)

  async function set(assigneeUserId: Id<"users"> | null) {
    try {
      await assign({ threadId: thread.id, assigneeUserId })
    } catch (error) {
      toast.error(errorMessage(error, locale))
    }
  }

  if (has("support.manage") && assignees !== undefined) {
    return (
      <Select
        value={thread.assigneeUserId ?? NOBODY}
        onValueChange={(value) =>
          set(value === NOBODY ? null : (value as Id<"users">))
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NOBODY}>{labels.unassigned}</SelectItem>
          {assignees.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              {person.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  const mine = me !== undefined && me !== null && thread.assigneeUserId === me.userId
  return (
    <div className="flex items-center gap-2">
      <span>{thread.assigneeName ?? labels.unassigned}</span>
      {has("support.reply") && me && thread.assigneeUserId === null && (
        <Button size="sm" variant="outline" onClick={() => set(me.userId)}>
          {labels.takeIt}
        </Button>
      )}
      {mine && (
        <Button size="sm" variant="ghost" onClick={() => set(null)}>
          {labels.release}
        </Button>
      )}
    </div>
  )
}

function StatusAction({ thread }: { thread: Thread }) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const { has } = usePermissions()
  const setStatus = useMutation(api.support.admin.adminSetStatus)
  if (!has("support.reply")) return null

  const resolved = thread.status === "resolved"
  return (
    <Button
      variant={resolved ? "outline" : "secondary"}
      onClick={async () => {
        try {
          await setStatus({
            threadId: thread.id,
            status: resolved ? "open" : "resolved",
          })
        } catch (error) {
          toast.error(errorMessage(error, locale))
        }
      }}
    >
      {resolved ? labels.reopen : labels.resolve}
    </Button>
  )
}

function Notes({ thread }: { thread: Thread }) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const { has } = usePermissions()
  const addNote = useMutation(api.support.admin.adminNote)
  const [draft, setDraft] = useState("")
  const [now] = useState(() => Date.now())

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{labels.notesHint}</p>
      {thread.notes.length === 0 ? (
        <p className="text-xs text-muted-foreground">{labels.noNotes}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {thread.notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-dashed p-2 text-xs whitespace-pre-wrap"
            >
              {note.body}
              <div className="mt-1 text-muted-foreground">
                {note.authorName ?? "—"} · {fmtAgo(note.at, now, locale)}
              </div>
            </li>
          ))}
        </ul>
      )}
      {has("support.reply") && (
        <>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={labels.notePlaceholder}
            className="min-h-12 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={draft.trim().length === 0}
            onClick={async () => {
              try {
                await addNote({ threadId: thread.id, body: draft })
                setDraft("")
              } catch (error) {
                toast.error(errorMessage(error, locale))
              }
            }}
          >
            {labels.addNote}
          </Button>
        </>
      )}
    </div>
  )
}

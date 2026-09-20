"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useMutation, useQuery } from "convex/react"
import { LinkIcon } from "lucide-react"
import { toast } from "sonner"

import { SheetBody, SheetShell } from "@/components/sheet-shell"
import { usePermissions } from "@/hooks/use-permissions"
import { UNMATCHED } from "@/features/unmatched/strings/unmatched"
import { t, type Locale } from "@/lib/i18n/locale"

/** Below this, a search matches most of the table and helps nobody. */
const MIN_SEARCH = 2

/**
 * Attach a report to the vault it was meant for.
 *
 * The backend half of this has existed since claims stopped silently
 * discarding unmatched reports — `claims.adminLinkSubject` — with no way to
 * call it. Until now a mistyped address meant the claimant waited on a report
 * nobody could repair, and the daily sweep closed it.
 *
 * **The search is the safeguard.** Linking is one-way by design: the mutation
 * refuses a claim that already has a vault, because re-pointing a live review
 * would move it to another person's estate and misfile every audit line already
 * written for it. So the operator picks a named account from a search rather
 * than typing an id, and the sheet says the rule before they choose rather than
 * surfacing it as an error afterwards.
 */
export function LinkSubject({
  claimId,
  typed,
  locale,
}: {
  claimId: Id<"claims">
  /** The address as the claimant typed it — what the operator reads against. */
  typed: string
  locale: Locale
}) {
  const labels = t(UNMATCHED, locale)
  const { has } = usePermissions()
  const link = useMutation(api.claims.adminLinkSubject)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [busy, setBusy] = useState(false)

  const query = search.trim()
  const candidates = useQuery(
    api.admin.ownersPage,
    query.length < MIN_SEARCH
      ? "skip"
      : {
          search: query,
          identity: [],
          plans: [],
          sort: "newest",
          paginationOpts: { numItems: 8, cursor: null },
        }
  )

  async function choose(subjectUserId: Id<"users">) {
    setBusy(true)
    try {
      await link({ claimId, subjectUserId })
      toast.success(labels.toastLinked)
      setOpen(false)
    } catch (error) {
      // The mutation refuses several things by name — a claim already
      // attached, a claimant naming themselves — and those messages are worth
      // showing rather than replacing with a generic failure.
      toast.error(
        labels.toastFailed,
        error instanceof Error ? { description: error.message } : undefined
      )
    } finally {
      setBusy(false)
    }
  }

  // Absent rather than disabled: a greyed-out control invites "why can't I?",
  // an absent one reads as "not my job". The refusal is in the mutation.
  if (!has("claims.rule")) return null

  return (
    <SheetShell
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setSearch("")
      }}
      trigger={
        <Button variant="outline" size="sm">
          <LinkIcon className="size-3.5" aria-hidden />
          {labels.link}
        </Button>
      }
      title={labels.linkTitle}
      description={labels.linkBody.replace("{typed}", typed)}
    >
      <SheetBody>
        <p className="text-xs text-muted-foreground">{labels.linkOnce}</p>

        <Input
          autoFocus
          value={search}
          placeholder={labels.linkSearch}
          onChange={(event) => setSearch(event.target.value)}
        />

        {query.length < MIN_SEARCH ? (
          <p className="text-sm text-muted-foreground">
            {labels.linkHintShort}
          </p>
        ) : candidates === undefined ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : candidates.page.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {labels.linkNoResults}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {candidates.page.map((owner) => (
              <li key={owner.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void choose(owner.id)}
                  className="flex w-full flex-col items-start rounded-md p-2 text-start hover:bg-accent disabled:opacity-50"
                >
                  <span className="font-medium">{owner.name}</span>
                  <span dir="ltr" className="text-xs text-muted-foreground">
                    {owner.email}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetBody>
    </SheetShell>
  )
}

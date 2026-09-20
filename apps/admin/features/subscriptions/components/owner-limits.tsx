"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { useMutation } from "convex/react"
import { UserCogIcon } from "lucide-react"
import { toast } from "sonner"

import { LimitField } from "@/features/subscriptions/components/limit-field"
import { SUBSCRIPTIONS } from "@/features/subscriptions/strings/subscriptions"
import { t, type Locale } from "@/lib/i18n/locale"

export type Override = {
  storageBytes?: number | null
  assets?: number | null
  heirs?: number | null
  photos?: boolean
  maxFileBytes?: number | null
}

/**
 * One account's limits, on top of its plan.
 *
 * For a pilot, a support case, an owner who needs more room than their tier
 * gives. Field by field on purpose: raising someone's storage should not
 * silently hand them every other paid limit as well.
 *
 * **An empty field is not zero.** It means this account takes the plan's
 * value — a state a plan limit does not have, and the reason `LimitField`
 * keeps `undefined` and `null` apart all the way to the mutation. The server
 * makes the same distinction in `limitsFor`, where collapsing the two would
 * turn every unlimited override back into the plan's cap.
 *
 * This is the quietest of the three entitlement writes: nothing about the
 * account looks unusual afterwards, and it stops matching the plan every screen
 * says it is on. Hence the audit line, and hence living in `billing.ts` with
 * the others.
 */
export function OwnerLimits({
  userId,
  name,
  override,
  locale,
}: {
  userId: Id<"users">
  name: string
  override: Override | null
  locale: Locale
}) {
  const labels = t(SUBSCRIPTIONS, locale)
  const setOverride = useMutation(api.billing.adminSetOverride)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Override>({})
  const [busy, setBusy] = useState(false)

  function start(next: boolean) {
    setOpen(next)
    if (next) {
      setDraft(override ?? {})
    }
  }

  async function save(clear: boolean) {
    setBusy(true)
    try {
      await setOverride({ userId, limits: clear ? null : prune(draft) })
      toast.success(clear ? labels.toastOverrideCleared : labels.toastOverride)
      setOpen(false)
    } catch (error) {
      toast.error(
        labels.toastFailed,
        error instanceof Error ? { description: error.message } : undefined
      )
    } finally {
      setBusy(false)
    }
  }

  function edit(patch: Override) {
    setDraft((prev) => prune({ ...prev, ...patch }))
  }

  return (
    <Sheet open={open} onOpenChange={start}>
      <SheetTrigger asChild>
        <Button
          variant={override === null ? "ghost" : "secondary"}
          size="icon-xs"
          title={labels.override}
        >
          <span className="sr-only">{labels.override}</span>
          <UserCogIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{labels.overrideTitle}</SheetTitle>
          <SheetDescription>
            {name}
            {" — "}
            {labels.overrideBody}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <LimitField
            inheritable
            label={labels.fieldStorage}
            unit={labels.megabytes}
            unlimitedLabel={labels.unlimited}
            inheritLabel={labels.inherit}
            value={draft.storageBytes}
            onChange={(next) => edit({ storageBytes: next })}
          />
          <LimitField
            inheritable
            label={labels.fieldAssets}
            unlimitedLabel={labels.unlimited}
            inheritLabel={labels.inherit}
            value={draft.assets}
            onChange={(next) => edit({ assets: next })}
          />
          <LimitField
            inheritable
            label={labels.fieldHeirs}
            unlimitedLabel={labels.unlimited}
            inheritLabel={labels.inherit}
            value={draft.heirs}
            onChange={(next) => edit({ heirs: next })}
          />
          <LimitField
            inheritable
            label={labels.fieldMaxFile}
            unit={labels.megabytes}
            unlimitedLabel={labels.unlimited}
            inheritLabel={labels.inherit}
            value={draft.maxFileBytes}
            onChange={(next) => edit({ maxFileBytes: next })}
          />

          {/* Three states again, and a checkbox only has two: unchecked has to
              mean "photos are off for this account", not "not overridden", or
              opening the sheet and closing it would quietly deny photos to
              everyone it touched. The link is how the third state is reached. */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.photos === true}
                onCheckedChange={(checked) =>
                  edit({ photos: checked === true })
                }
              />
              {labels.fieldPhotos}
            </label>
            {draft.photos !== undefined && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => setDraft((prev) => prune({ ...prev, photos: undefined }))}
              >
                {labels.inherit}
              </button>
            )}
          </div>
        </div>

        <SheetFooter className="flex-row justify-between">
          <Button
            variant="ghost"
            disabled={busy || override === null}
            onClick={() => void save(true)}
          >
            {labels.clearOverride}
          </Button>
          <Button disabled={busy} onClick={() => void save(false)}>
            {busy ? labels.saving : labels.save}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/** `undefined` cannot travel as a field value; it has to be an absent key. */
function prune(draft: Override): Override {
  return Object.fromEntries(
    Object.entries(draft).filter(([, value]) => value !== undefined)
  )
}

"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
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
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useMutation, useQuery } from "convex/react"
import { SlidersHorizontalIcon } from "lucide-react"
import { toast } from "sonner"

import { LimitField } from "@/features/subscriptions/components/limit-field"
import { SUBSCRIPTIONS } from "@/features/subscriptions/strings/subscriptions"
import { t, type Locale } from "@/lib/i18n/locale"

type Limits = {
  storageBytes: number | null
  assets: number | null
  heirs: number | null
  photos: boolean
  maxFileBytes: number | null
}

/**
 * The catalogue editor: what each plan allows, without a deploy.
 *
 * It is entitlement, not configuration, and the difference matters. Granting a
 * subscription changes one account; raising the free plan's caps changes every
 * account at once, and it is the quietest way to give the product away. So it
 * goes through `billing.adminSetLimits` like everything else that decides who
 * gets what — admin-gated, audited, and the only module allowed to write it.
 *
 * The sheet says what saving does, because nothing else on the screen would:
 * limits apply immediately to everyone, and an owner already past a lowered cap
 * keeps everything and simply stops being able to add. Nothing is deleted, and
 * an operator should not have to take that on faith.
 *
 * Prices are not here and cannot be — the stores own them. The sheet says that
 * too, rather than leaving someone hunting for a field that will never exist.
 */
export function PlanLimits({ locale }: { locale: Locale }) {
  const labels = t(SUBSCRIPTIONS, locale)
  const catalogue = useQuery(api.plans.catalogue)
  const setLimits = useMutation(api.billing.adminSetLimits)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, Limits> | null>(null)
  const [busy, setBusy] = useState(false)

  // Seeded when the sheet opens rather than on every render: a live query
  // behind an open form would overwrite whatever the operator is halfway
  // through typing the moment anything else on the deployment changed.
  function start(next: boolean) {
    setOpen(next)
    if (next && catalogue !== undefined) {
      setDraft(Object.fromEntries(catalogue.map((row) => [row.key, row.limits])))
    }
  }

  async function save() {
    if (draft === null) return
    setBusy(true)
    try {
      for (const [plan, limits] of Object.entries(draft)) {
        await setLimits({ plan: plan as "free" | "annual", limits })
      }
      toast.success(labels.toastLimits)
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

  function edit(plan: string, patch: Partial<Limits>) {
    setDraft((prev) =>
      prev === null ? prev : { ...prev, [plan]: { ...prev[plan]!, ...patch } }
    )
  }

  return (
    <Sheet open={open} onOpenChange={start}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontalIcon className="size-3.5" aria-hidden />
          {labels.editLimits}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{labels.editLimitsTitle}</SheetTitle>
          <SheetDescription>{labels.editLimitsBody}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4">
          {draft === null ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            Object.entries(draft).map(([plan, limits]) => (
              <section key={plan} className="flex flex-col gap-3">
                <h3 className="font-heading text-sm font-bold">
                  {plan === "annual" ? labels.planAnnual : labels.planFree}
                </h3>

                <LimitField
                  label={labels.fieldStorage}
                  unit={labels.megabytes}
                  unlimitedLabel={labels.unlimited}
                  inheritLabel={labels.inherit}
                  value={limits.storageBytes}
                  onChange={(next) =>
                    edit(plan, { storageBytes: next ?? null })
                  }
                />
                <LimitField
                  label={labels.fieldAssets}
                  unlimitedLabel={labels.unlimited}
                  inheritLabel={labels.inherit}
                  value={limits.assets}
                  onChange={(next) => edit(plan, { assets: next ?? null })}
                />
                <LimitField
                  label={labels.fieldHeirs}
                  unlimitedLabel={labels.unlimited}
                  inheritLabel={labels.inherit}
                  value={limits.heirs}
                  onChange={(next) => edit(plan, { heirs: next ?? null })}
                />
                <LimitField
                  label={labels.fieldMaxFile}
                  unit={labels.megabytes}
                  unlimitedLabel={labels.unlimited}
                  inheritLabel={labels.inherit}
                  value={limits.maxFileBytes}
                  onChange={(next) =>
                    edit(plan, { maxFileBytes: next ?? null })
                  }
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={limits.photos}
                    onCheckedChange={(checked) =>
                      edit(plan, { photos: checked === true })
                    }
                  />
                  {labels.fieldPhotos}
                </label>
              </section>
            ))
          )}

          <p className="text-xs text-muted-foreground">{labels.noPricesHere}</p>
        </div>

        <SheetFooter>
          <Button onClick={() => void save()} disabled={busy || draft === null}>
            {busy ? labels.saving : labels.save}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

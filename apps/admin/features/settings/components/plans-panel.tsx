"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { useLocale } from "@/components/locale-provider"
import { usePermissions } from "@/hooks/use-permissions"
import { TableCard } from "@/components/table-card"
import {
  SettingRow,
  SettingRows,
} from "@/features/settings/components/setting-row"
import { LimitField } from "@/features/subscriptions/components/limit-field"
import { SETTINGS } from "@/features/settings/strings/settings"
import { SUBSCRIPTIONS } from "@/features/subscriptions/strings/subscriptions"
import { t } from "@/lib/i18n/locale"

type Limits = {
  storageBytes: number | null
  assets: number | null
  heirs: number | null
  photos: boolean
  maxFileBytes: number | null
}

/**
 * The plan catalogue: what each tier allows, without a deploy.
 *
 * It was a sheet behind a button on the subscriptions queue, which was the
 * wrong home twice over — a queue is a list of accounts to act on, and a form
 * that changes what every account on a tier is allowed is not an action on any
 * one of them. It is configuration, so it lives in settings, and there is only
 * one way in.
 *
 * It is entitlement, and the difference from a preference matters. Granting one
 * subscription changes one account; raising the free plan's caps changes every
 * account at once and is the quietest way to give the product away. So it goes
 * through `billing.adminSetLimits` like everything else that decides who gets
 * what — admin-gated, audited, one module.
 *
 * The card says what saving does, because nothing else on the screen would:
 * limits apply immediately to everyone, and an owner already past a lowered cap
 * keeps everything and simply stops being able to add. Nothing is deleted, and
 * an operator should not have to take that on faith.
 */
export function PlansPanel() {
  const locale = useLocale()
  const labels = t(SUBSCRIPTIONS, locale)
  // The row chrome is shared with every other settings screen, so its copy
  // comes from there rather than being restated in the billing dictionary.
  const shared = t(SETTINGS, locale)
  const catalogue = useQuery(api.plans.catalogue)
  const setLimits = useMutation(api.billing.adminSetLimits)
  const { has } = usePermissions()
  const canManage = has("billing.manage")

  // Edits only, overlaid on the server's copy — never a seeded clone, which
  // would overwrite whatever is being typed the moment anything else changed.
  const [edits, setEdits] = useState<Record<string, Partial<Limits>>>({})
  const [busy, setBusy] = useState(false)

  if (catalogue === undefined) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  const merged = catalogue.map((row) => ({
    key: row.key,
    limits: { ...row.limits, ...(edits[row.key] ?? {}) } as Limits,
  }))

  function edit(plan: string, patch: Partial<Limits>) {
    setEdits((prev) => ({
      ...prev,
      [plan]: { ...(prev[plan] ?? {}), ...patch },
    }))
  }

  async function save() {
    setBusy(true)
    try {
      for (const { key, limits } of merged) {
        await setLimits({ plan: key, limits })
      }
      setEdits({})
      toast.success(labels.toastLimits)
    } catch (error) {
      toast.error(
        labels.toastFailed,
        error instanceof Error ? { description: error.message } : undefined
      )
    } finally {
      setBusy(false)
    }
  }

  const limitRows = [
    ["fieldStorage", "storageBytes", labels.megabytes],
    ["fieldAssets", "assets", undefined],
    ["fieldHeirs", "heirs", undefined],
    ["fieldMaxFile", "maxFileBytes", labels.megabytes],
  ] as const

  // Read-only without `billing.manage`: a plan row is every owner on that
  // plan at once, so seeing the catalogue and changing it are not the same
  // permission. The fieldset disables every field in one place.
  return (
    <fieldset disabled={!canManage} className="contents">
      <div className="flex flex-col gap-6">
        {merged.map(({ key, limits }, index) => (
          <TableCard
            key={key}
            title={key === "annual" ? labels.planAnnual : labels.planFree}
            // On the first panel only: one save writes every plan, so repeating
            // the button per card would imply each saves its own.
            action={
              index === 0 && canManage ? (
                <Button disabled={busy} size="sm" onClick={() => void save()}>
                  {busy ? labels.saving : labels.save}
                </Button>
              ) : undefined
            }
            footnote={index === 0 ? labels.editLimitsBody : undefined}
          >
            <SettingRows>
              {limitRows.map(([labelKey, field, unit]) => (
                <SettingRow
                  key={field}
                  label={labels[labelKey]}
                  labels={shared}
                >
                  <LimitField
                    unit={unit}
                    unlimitedLabel={labels.unlimited}
                    inheritLabel={labels.inherit}
                    value={limits[field]}
                    onChange={(next) => edit(key, { [field]: next ?? null })}
                  />
                </SettingRow>
              ))}

              <SettingRow label={labels.fieldPhotos} labels={shared}>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={limits.photos}
                    onCheckedChange={(checked) =>
                      edit(key, { photos: checked === true })
                    }
                  />
                  {limits.photos ? shared.credSet : shared.credMissing}
                </label>
              </SettingRow>
            </SettingRows>
          </TableCard>
        ))}

        <p className="text-xs text-muted-foreground">{labels.noPricesHere}</p>
        <p className="text-xs text-muted-foreground">{labels.landingRebuild}</p>
      </div>
    </fieldset>
  )
}

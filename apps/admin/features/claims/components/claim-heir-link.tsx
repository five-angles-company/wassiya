"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { ConfirmAction } from "@/components/confirm-action"
import { CLAIMS } from "@/features/claims/strings/claims"
import { fmtNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

/** One of the owner's heirs, as `admin.claimDetail` returns them. */
export type LinkableHeir = {
  id: string
  name: string
  relation: string
  routedAssetCount: number
}

/**
 * Bind a claimant to one of the deceased's heirs.
 *
 * The step that decides *what the claimant receives* — `guardianConfirm`
 * refuses a claim with no heir linked, so this gates the whole release. The
 * routed-asset count sits in each option because an heir who would receive
 * nothing is almost always the wrong link, and that is not visible from a name
 * and a relation alone.
 *
 * Reversible until release, which is why the dialog is neutral rather than
 * destructive: `adminLinkHeir` refuses only once a claim is `released`.
 */
export function ClaimHeirLink({
  claimId,
  linkedHeirId,
  heirs,
  locale,
}: {
  claimId: string
  linkedHeirId: string | null
  heirs: readonly LinkableHeir[]
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const linkHeir = useMutation(api.claims.adminLinkHeir)
  const [chosen, setChosen] = useState<string>("")

  const target = chosen || linkedHeirId

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">
          {labels.heirTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {heirs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{labels.heirNone}</p>
        ) : (
          <>
            <Select value={target ?? ""} onValueChange={setChosen}>
              <SelectTrigger>
                <SelectValue placeholder={labels.heirPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {heirs.map((heir) => (
                  <SelectItem key={heir.id} value={heir.id}>
                    {heir.name} · {heir.relation} ·{" "}
                    {labels.heirAssets.replace(
                      "{n}",
                      fmtNumber(heir.routedAssetCount, locale)
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ConfirmAction
              tone="neutral"
              title={labels.linkDialogTitle}
              body={labels.linkDialogBody}
              confirmLabel={labels.linkConfirm}
              cancelLabel={labels.cancel}
              onConfirm={async () => {
                try {
                  await linkHeir({
                    claimId: claimId as Id<"claims">,
                    heirId: target as Id<"heirs">,
                  })
                  toast.success(labels.toastLinked)
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : labels.toastFailed
                  )
                }
              }}
              trigger={
                <Button
                  size="sm"
                  className="self-start"
                  disabled={target === null || target === ""}
                >
                  {labels.linkHeir}
                </Button>
              }
            />
            <p className="text-xs text-muted-foreground">{labels.heirHint}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

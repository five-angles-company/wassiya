"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { Paper } from "@/components/doc/paper"
import { DocSection } from "@/components/doc/section"
import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { AssetRow, type BoxItem } from "@/features/box/components/asset-row"
import { labelFor, type OpenedBundle } from "@/features/box/lib/open-box"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

/**
 * After the halves meet: what was actually left to this heir.
 *
 * ## Why this query is separate from the bundle
 *
 * The bundle carries keys and nothing else — `assetId → DEK`. Until
 * `release.assetsForHeir` existed there was no list to decrypt them against, so
 * an opened box could report a key count and not one thing anyone could
 * receive. This joins the two: the server's list of ciphertext, the heir's map
 * of keys, and `openLabel` in between.
 *
 * `assetsForHeir` is a query, not a mutation, precisely so this can re-run
 * freely — it hands over no key material, and the ciphertext it names is
 * useless without the DEK the reader is already holding in this tab.
 *
 * ## Order
 *
 * Rows the bundle has a key for come first. A row it cannot name is not an
 * error the reader can act on, and putting it at the bottom keeps it from being
 * the first thing they see in a box they have waited a month to open.
 */
export function OpenedBox({
  claimId,
  bundle,
}: {
  claimId: string
  bundle: OpenedBundle
}) {
  const locale = useLocale()
  const labels = t(HEIR_BOX, locale)
  const contents = useQuery(api.release.assetsForHeir, { claimId })

  if (contents === undefined) {
    return (
      <div className="border-border h-40 animate-pulse border-y" aria-hidden />
    )
  }
  // The five preconditions are re-asserted inside the query, so `null` here
  // means the claim stopped qualifying between opening the bundle and asking
  // for the list — a vetoed claim, or a session that changed hands.
  if (contents === null) {
    return (
      <DocSection title={labels.notReleased}>
        <p className="text-muted-foreground text-[14px] leading-[1.7]">
          {labels.failed}
        </p>
      </DocSection>
    )
  }

  const items: BoxItem[] = contents.items.map((item) => {
    const dek = bundle.deks[item.assetId]
    const label = labelFor(item.labelSealed, dek)
    return {
      assetId: item.assetId,
      type: item.type,
      title: label?.title ?? null,
      subtitle: label?.subtitle,
      byteSize: item.meta.byteSize,
      mimeType: item.meta.mimeType,
      via: item.via,
      contentUrls: item.contentUrls,
      hasInstructions: item.instructionsCiphertext !== null,
      dek,
    }
  })
  items.sort((a, b) => Number(a.title === null) - Number(b.title === null))

  return (
    <div className="flex flex-col gap-6">
      <DocSection title={labels.openTitle}>
        <p className="text-muted-foreground max-w-[66ch] text-[14.5px] leading-[1.72]">
          {labels.openBody}
        </p>
        <p className="bg-secondary text-secondary-foreground mt-5 inline-flex h-11 items-center rounded-full px-6 text-[14.5px] font-bold">
          {labels.itemCount.replace("{n}", fmtNumber(items.length, locale))}
        </p>
        <p className="text-muted-foreground mt-5 text-[13px] leading-[1.65]">
          {labels.expiry}
        </p>
      </DocSection>

      {/* A personal message is not an asset — it has its own key map and no
          `assetRecipients` row — so it gets its own card rather than a row that
          would need every column to be optional. */}
      {contents.messageKind !== null &&
        Object.keys(bundle.messageKeys).length > 0 && (
          <DocSection title={labels.messageTitle}>
            <p className="text-muted-foreground text-[14px] leading-[1.7]">
              {labels.messageBody}
            </p>
          </DocSection>
        )}

      <Paper>
        <ul className="divide-border divide-y">
          {items.map((item) => (
            <AssetRow key={item.assetId} item={item} />
          ))}
        </ul>
      </Paper>
    </div>
  )
}

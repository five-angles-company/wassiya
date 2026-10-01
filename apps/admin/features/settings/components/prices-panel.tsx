"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { currencyDigits, fmtPrice, parsePrice } from "@workspace/ui/lib/price"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { ConfirmAction } from "@/components/confirm-action"
import { useLocale } from "@/components/locale-provider"
import { TableCard } from "@/components/table-card"
import { SUBSCRIPTIONS } from "@/features/subscriptions/strings/subscriptions"
import { usePermissions } from "@/hooks/use-permissions"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

/** `DEFAULT_MARKET` in `convex/model/prices.ts`. */
const EVERY_MARKET = "*"

type Draft = {
  market: string
  everyMarket: boolean
  currency: string
  amount: string
  taxInclusive: boolean
  checked: boolean
}

const EMPTY: Draft = {
  market: "",
  everyMarket: false,
  currency: "",
  amount: "",
  taxInclusive: true,
  checked: false,
}

function marketName(market: string, locale: Locale, everyMarket: string): string {
  if (market === EVERY_MARKET) {
    return everyMarket
  }
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(market) ?? market
  } catch {
    return market
  }
}

/**
 * The yearly plan's price per store country, as wassiya.app shows it.
 *
 * ⚠️ Display only: the stores decide what is charged, and the app renders the
 * store's own price. Saving needs the operator to tick that they checked the
 * store today, which stamps `verifiedAt` — a row nobody has checked is how the
 * site ends up advertising a price nobody can buy at.
 */
export function PricesPanel() {
  const locale = useLocale()
  const labels = t(SUBSCRIPTIONS, locale)
  const rows = useQuery(api.prices.catalogue, { plan: "annual" })
  const setPrice = useMutation(api.prices.adminSet)
  const removePrice = useMutation(api.prices.adminRemove)
  const { has } = usePermissions()
  const canManage = has("billing.manage")

  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [busy, setBusy] = useState(false)

  if (rows === undefined) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  const sorted = [...rows].sort((a, b) =>
    a.market === EVERY_MARKET ? -1 : b.market === EVERY_MARKET ? 1 : a.market.localeCompare(b.market)
  )

  const market = draft.everyMarket ? EVERY_MARKET : draft.market.trim().toUpperCase()
  const currency = draft.currency.trim().toUpperCase()
  const marketOk = draft.everyMarket || /^[A-Z]{2}$/.test(market)
  const currencyOk = /^[A-Z]{3}$/.test(currency)
  const amountMinor = currencyOk ? parsePrice(draft.amount, currency) : null
  const ready = marketOk && currencyOk && amountMinor !== null && draft.checked

  function edit(row: (typeof sorted)[number]) {
    const digits = currencyDigits(row.currency)
    setDraft({
      market: row.market === EVERY_MARKET ? "" : row.market,
      everyMarket: row.market === EVERY_MARKET,
      currency: row.currency,
      amount: (row.amountMinor / 10 ** digits).toFixed(digits),
      taxInclusive: row.taxInclusive,
      checked: false,
    })
  }

  async function save() {
    if (!ready || amountMinor === null) return
    setBusy(true)
    try {
      await setPrice({
        plan: "annual",
        market,
        currency,
        amountMinor,
        taxInclusive: draft.taxInclusive,
      })
      setDraft(EMPTY)
      toast.success(labels.toastPrice)
    } catch (error) {
      toast.error(
        labels.toastPriceFailed,
        error instanceof Error ? { description: error.message } : undefined
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <TableCard title={labels.pricesTitle} hint={labels.pricesHint} footnote={labels.landingRebuild}>
      <p className="border-b bg-muted/50 px-4 py-3 text-sm leading-relaxed">{labels.pricesWarning}</p>

      {sorted.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">{labels.pricesEmpty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4">{labels.colMarket}</TableHead>
              <TableHead>{labels.colPrice}</TableHead>
              <TableHead>{labels.colTax}</TableHead>
              <TableHead>{labels.colChecked}</TableHead>
              {canManage && <TableHead className="pe-4" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => {
              const name = marketName(row.market, locale, labels.marketDefault)
              return (
                <TableRow key={row._id}>
                  <TableCell className="ps-4 font-medium">
                    {name}
                    {row.market !== EVERY_MARKET && (
                      <span className="ms-2 font-mono text-xs text-muted-foreground">{row.market}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {fmtPrice(row.amountMinor, row.currency, locale)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.taxInclusive ? labels.taxIncluded : labels.taxExcluded}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(row.verifiedAt, locale)}</TableCell>
                  {canManage && (
                    <TableCell className="pe-4 text-end">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => edit(row)}>
                          {labels.editPrice}
                        </Button>
                        <ConfirmAction
                          tone="destructive"
                          title={labels.removePriceTitle.replace("{market}", name)}
                          body={labels.removePriceBody}
                          confirmLabel={labels.removePrice}
                          cancelLabel={labels.cancel}
                          onConfirm={async () => {
                            await removePrice({ plan: "annual", market: row.market })
                            toast.success(labels.toastPriceRemoved)
                          }}
                          trigger={
                            <Button variant="ghost" size="sm" className="text-destructive">
                              {labels.removePrice}
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {canManage && (
        <div className="flex flex-col gap-4 border-t px-4 py-5">
          <p className="text-sm font-semibold">{labels.priceFormTitle}</p>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{labels.fieldMarket}</span>
              <Input
                dir="ltr"
                maxLength={2}
                placeholder="SA"
                disabled={draft.everyMarket}
                value={draft.everyMarket ? "" : draft.market}
                aria-invalid={!draft.everyMarket && draft.market !== "" && !marketOk}
                onChange={(event) => setDraft({ ...draft, market: event.target.value })}
              />
              <span className="text-xs text-muted-foreground">
                {!draft.everyMarket && draft.market !== "" && !marketOk ? labels.invalidMarket : labels.fieldMarketHint}
              </span>
              <span className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={draft.everyMarket}
                  onCheckedChange={(checked) => setDraft({ ...draft, everyMarket: checked === true })}
                />
                {labels.fieldEveryMarket}
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{labels.fieldCurrency}</span>
              <Input
                dir="ltr"
                maxLength={3}
                placeholder="SAR"
                value={draft.currency}
                aria-invalid={draft.currency !== "" && !currencyOk}
                onChange={(event) => setDraft({ ...draft, currency: event.target.value })}
              />
              <span className="text-xs text-muted-foreground">
                {draft.currency !== "" && !currencyOk ? labels.invalidCurrency : labels.fieldCurrencyHint}
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{labels.fieldAmount}</span>
              <Input
                dir="ltr"
                inputMode="decimal"
                placeholder="379.99"
                value={draft.amount}
                aria-invalid={draft.amount !== "" && currencyOk && amountMinor === null}
                onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
              />
              <span className="text-xs text-muted-foreground">
                {draft.amount !== "" && currencyOk && amountMinor === null
                  ? labels.invalidAmount
                  : amountMinor !== null
                    ? fmtPrice(amountMinor, currency, locale)
                    : labels.fieldAmountHint}
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={draft.taxInclusive}
                  onCheckedChange={(checked) => setDraft({ ...draft, taxInclusive: checked === true })}
                />
                {labels.fieldTaxIncluded}
              </label>
              <label className="flex items-center gap-2 font-medium">
                <Checkbox
                  checked={draft.checked}
                  onCheckedChange={(checked) => setDraft({ ...draft, checked: checked === true })}
                />
                {labels.confirmChecked}
              </label>
            </div>
            <Button disabled={!ready || busy} onClick={() => void save()}>
              {busy ? labels.saving : labels.savePrice}
            </Button>
          </div>
        </div>
      )}
    </TableCard>
  )
}

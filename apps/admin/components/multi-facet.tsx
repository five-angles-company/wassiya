"use client"

import type { Dispatch, SetStateAction } from "react"

import {
  FacetedFilter,
  type FacetOption,
} from "@/components/data-table-faceted-filter"

/**
 * `FacetedFilter` bound to a `useState` array of selected values.
 *
 * Every server-side facet in this console keeps the same three things: the
 * selected values as an array, a `Set` of them for the control, and a reset of
 * the cursor stack on every change — because a filter that narrows the rows
 * while the reader sits on page 4 would page into a result set that no longer
 * has one. Writing that out per facet was thirty lines that had to stay
 * identical to stay correct; the third screen to grow a second facet is where
 * that stops being worth it.
 *
 * It owns selection only. Which values exist, what they are called, and what
 * the server does with them stay with the screen.
 */
export function MultiFacet<T extends string>({
  title,
  options,
  values,
  onChange,
  onReset,
  clearLabel,
}: {
  title: string
  options: FacetOption[]
  values: T[]
  onChange: Dispatch<SetStateAction<T[]>>
  /** Run after every change — in practice, rewinding to the first page. */
  onReset: () => void
  clearLabel: string
}) {
  return (
    <FacetedFilter
      title={title}
      options={options}
      selected={new Set<string>(values)}
      onToggle={(value, checked) => {
        onChange((current) =>
          checked
            ? current.includes(value as T)
              ? current
              : [...current, value as T]
            : current.filter((entry) => entry !== value)
        )
        onReset()
      }}
      onClear={() => {
        onChange([])
        onReset()
      }}
      count={() => undefined}
      clearLabel={clearLabel}
    />
  )
}

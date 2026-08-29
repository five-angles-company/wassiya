"use client"

import {
  FacetedFilter,
  type FacetOption,
} from "@/components/data-table-faceted-filter"

/**
 * Accepts an updater and nothing else.
 *
 * Deliberately narrower than `Dispatch<SetStateAction<T[]>>`, so that both a
 * `useState` setter and a nuqs one satisfy it: nuqs returns a promise and
 * allows `null` for "clear the param", neither of which `Dispatch` describes.
 * Restricting the call site to the function form is what makes the two
 * interchangeable here.
 */
type ArrayUpdater<T> = (updater: (current: T[]) => T[]) => unknown

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
  onChange: ArrayUpdater<T>
  /**
   * Run after every change.
   *
   * Now that the values live in the URL the cursor stack rewinds on its own —
   * see `use-table-url-state`. This stays for anything a screen genuinely has
   * to do alongside, and every current caller passes a no-op.
   */
  onReset?: () => void
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
        onReset?.()
      }}
      onClear={() => {
        onChange(() => [])
        onReset?.()
      }}
      count={() => undefined}
      clearLabel={clearLabel}
    />
  )
}

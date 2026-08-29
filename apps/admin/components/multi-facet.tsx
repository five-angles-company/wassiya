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
 * Every server-side facet in this console keeps the same two things: the
 * selected values as an array, and a `Set` of them for the control. Writing
 * that out per facet was twenty lines that had to stay identical to stay
 * correct; the third screen to grow a second facet is where that stopped being
 * worth it.
 *
 * `onChange` is called with an updater and never a value, which is what lets a
 * `useState` setter and a nuqs one both satisfy it.
 *
 * It owns selection only. Which values exist, what they are called, and what
 * the server does with them stay with the screen — and there is no reset
 * callback, because the cursor rewind is derived from the params themselves
 * now. See `use-table-url-state`.
 */
export function MultiFacet<T extends string>({
  title,
  options,
  values,
  onChange,
  clearLabel,
}: {
  title: string
  options: FacetOption[]
  values: T[]
  onChange: ArrayUpdater<T>
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
      }}
      onClear={() => onChange(() => [])}
      count={() => undefined}
      clearLabel={clearLabel}
    />
  )
}

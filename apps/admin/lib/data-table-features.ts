import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table"

/**
 * The table's capabilities, stitched together once at module scope.
 *
 * TanStack Table v9 is feature-opt-in: nothing is bundled unless it is named
 * here, which is why this file exists at all. Note that this is **not** the v8
 * API — there is no `useReactTable`, no `getCoreRowModel()`, no `flexRender`
 * import. Most examples in the wild are still v8 and will not compile against
 * the installed 9.2.3.
 *
 * Row selection is deliberately left out. Nothing in this console acts on many
 * rows at once — a death claim is reviewed one at a time, by a person, on
 * purpose — so a checkbox column would be a column of dead weight.
 *
 * Declared at module scope rather than inside a component because the helper's
 * own docs ask for that: the object is a static type carrier, and rebuilding it
 * per render would rebuild the table's type identity with it.
 */
export const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

export type DataTableFeatures = typeof features

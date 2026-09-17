import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludesSome,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type ReactTable,
  type RowData,
} from "@tanstack/react-table"

/**
 * The table's capabilities, stitched together once at module scope. TanStack
 * Table v9 is feature-opt-in: nothing is bundled unless it is named here.
 *
 * This is **not** the v8 API — no `useReactTable`, no `getCoreRowModel()`, no
 * `flexRender`. Most examples in the wild are still v8 and will not compile
 * against the installed 9.2.3; verified against `node_modules/@tanstack/
 * table-core` rather than recalled. Row-model factories are slots and each
 * belongs *after* the feature that consumes it — `facetedRowModel` does nothing
 * without `columnFacetingFeature`.
 *
 * Row selection exists, because it is how an operator exports a slice or copies
 * a set of ids. **No verdict on a claim may ever be a bulk action**, though:
 * `adminSetNameMatch` routes a rejected claim to `locked` with a 90-day bar and
 * `nameMatchBlockedReason` then answers `"past-review"` for every later call, so
 * there is no admin path back and a mis-aimed bulk reject would permanently lock
 * legitimate heirs out of an inheritance. Bulk operations here are read-only by
 * construction; see `data-table-bulk-bar.tsx`.
 */
export const features = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    // The multi-select faceted filters: a column value must appear in the set
    // the operator ticked. `arrIncludesSome` reads the *filter value* as the
    // array, which is the direction a facet needs.
    arrIncludesSome: filterFn_arrIncludesSome,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
})

export type DataTableFeatures = typeof features

/**
 * What `useTable` actually hands back.
 *
 * Not `Table` — that is the framework-agnostic core, and it carries no `state`.
 * The React adapter wraps it as `ReactTable`, which adds `state`, `Subscribe`
 * and `FlexRender`. A child component typed as `Table` therefore cannot read
 * `table.state.globalFilter`, which is exactly the compile error that sends
 * people reaching for v8's `getState()` — a method v9 does not have.
 */
export type DataTableInstance<TData extends RowData> = ReactTable<
  DataTableFeatures,
  TData
>

/**
 * Page sizes offered in the pager.
 *
 * The first is the default, and it is deliberately smaller than the server's
 * own `CLAIMS_PAGE` of 100 — a page that exactly matched the fetch cap would
 * make "next page" and "there is more on the server" look like the same thing.
 */
export const PAGE_SIZES = [10, 25, 50, 100] as const

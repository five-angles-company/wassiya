/**
 * CSV export, for the rows an operator has selected.
 *
 * Deliberately small and dependency-free. The console exports operational
 * facts — ids, statuses, dates — so a spreadsheet can be handed to someone in
 * a meeting; it is not a reporting pipeline and should not grow into one.
 *
 * **Nothing encrypted is exportable**, and that is a property of the callers
 * rather than of this file: the admin queries return no ciphertext and no key
 * material, so there is nothing here to leak even by accident.
 */

/** One column of an export: a header, and how to read it off a row. */
export type CsvColumn<TData> = {
  header: string
  value: (row: TData) => string | number | null | undefined
}

/**
 * Quote a field for RFC 4180.
 *
 * The leading apostrophe on `=`, `+`, `-` and `@` is not cosmetic: Excel and
 * Sheets treat a cell starting with any of them as a formula, so a claimant
 * who names themselves `=HYPERLINK(...)` gets it *executed* when a reviewer
 * opens the export. That is CSV injection, and this is the fix for it.
 */
function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  const text = String(value)
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${guarded.replace(/"/g, '""')}"`
}

export function toCsv<TData>(
  rows: readonly TData[],
  columns: readonly CsvColumn<TData>[]
): string {
  const head = columns.map((column) => escapeCell(column.header)).join(",")
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(",")
  )
  return [head, ...body].join("\r\n")
}

/**
 * Hand the file to the browser.
 *
 * The BOM is what makes Excel read the Arabic columns as UTF-8 rather than as
 * the system codepage — without it every Arabic name in the export opens as
 * mojibake, which is the whole file wasted.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

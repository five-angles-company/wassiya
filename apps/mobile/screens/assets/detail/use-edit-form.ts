/**
 * Form state for an asset edit: prefill once, patch, and know when it changed.
 *
 * Every type repeats the same four moves — parse the decrypted payload into a
 * form, patch fields as they are typed, compare against what was loaded to
 * decide whether saving is even offered, and re-baseline after a successful
 * write. Six copies of that is six chances to forget the re-baseline and leave
 * a screen permanently claiming unsaved changes.
 *
 * ## Prefilled during render, and exactly once
 *
 * This is React's "adjusting state when a prop changes" pattern rather than an
 * effect. Two reasons, and both are visible to the owner:
 *
 * - An effect fills the form one frame *after* the first paint, so the screen
 *   flashes empty fields over an asset that has already decrypted.
 * - Re-running the prefill whenever the payload changes would race the owner's
 *   own typing. Saving makes Convex re-emit the row, which re-decrypts to the
 *   just-saved payload; anything typed in the moment between the two would be
 *   overwritten by the thing that was saved a heartbeat earlier.
 *
 * So it fills from the first payload that arrives and never again. The screen
 * unmounts when the owner leaves, so reopening re-reads from storage.
 *
 * ## `null` is "could not read", not "empty"
 *
 * When the parser refuses — a rotated format, a hand-edited row — the form
 * stays `null` and the screen must say so rather than rendering blank fields.
 * An empty form over an unreadable payload is an offer to overwrite a password
 * with nothing, made by a screen that never showed the owner what was there.
 */
import { useCallback, useState } from "react"

export type EditForm<T> = {
  /** `null` while loading, or when the payload could not be parsed. */
  form: T | null
  patch: (fields: Partial<T>) => void
  /** True once the form differs from what was loaded. */
  dirty: boolean
  /** Call after a successful save, so the screen stops offering to save again. */
  commit: () => void
}

export function useEditForm<T extends object>(
  /** The decrypted payload, or `null` until it arrives. */
  source: string | null,
  parse: (raw: string) => T | null
): EditForm<T> {
  const [form, setForm] = useState<T | null>(null)
  const [baseline, setBaseline] = useState<string | null>(null)
  const [filled, setFilled] = useState(false)

  if (source !== null && !filled) {
    const parsed = parse(source)
    setFilled(true)
    setForm(parsed)
    setBaseline(parsed === null ? null : JSON.stringify(parsed))
  }

  const patch = useCallback((fields: Partial<T>) => {
    setForm((current) =>
      current === null ? current : { ...current, ...fields }
    )
  }, [])

  const commit = useCallback(() => {
    setBaseline(form === null ? null : JSON.stringify(form))
  }, [form])

  const dirty =
    form !== null && baseline !== null && JSON.stringify(form) !== baseline

  return { form, patch, dirty, commit }
}

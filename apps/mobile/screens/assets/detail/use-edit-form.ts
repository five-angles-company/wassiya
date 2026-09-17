/**
 * Form state for an asset edit: prefill once, patch, and know when it changed —
 * shared so six screens cannot each forget to re-baseline after a save and
 * leave a screen permanently claiming unsaved changes.
 *
 * The prefill happens **during render and exactly once**, not in an effect. An
 * effect fills one frame after the first paint, flashing empty fields over an
 * asset that has already decrypted; and re-running it whenever the payload
 * changes would race the owner's typing, because saving makes Convex re-emit
 * the row and anything typed in between would be overwritten by the value
 * saved a heartbeat earlier.
 *
 * `null` means "could not read", not "empty". When the parser refuses the
 * screen must say so — an empty form over an unreadable payload is an offer to
 * overwrite a password with nothing.
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
  /** Throw the edits away and go back to what was loaded. */
  reset: () => void
}

export function useEditForm<T extends object, S>(
  /** The opened asset, or `null` until it arrives. */
  source: S | null,
  parse: (source: S) => T | null
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

  const reset = useCallback(() => {
    // Back to the baseline, which is the last thing that was actually stored —
    // not to the payload as first loaded, or cancelling after a save would
    // undo the save.
    setForm(baseline === null ? null : (JSON.parse(baseline) as T))
  }, [baseline])

  const dirty =
    form !== null && baseline !== null && JSON.stringify(form) !== baseline

  return { form, patch, dirty, commit, reset }
}

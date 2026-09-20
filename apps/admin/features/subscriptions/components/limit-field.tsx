"use client"

import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"

/**
 * One editable limit.
 *
 * A limit has three states and they are genuinely different, which is why this
 * is not a number input:
 *
 *   - a number — the cap;
 *   - `null` — unlimited, which no number can express;
 *   - `undefined` — *not set here*, meaning fall through to the plan. Only the
 *     per-account override has this state, hence `inheritable`.
 *
 * Collapsing `null` and `undefined` is the exact mistake `limitsFor` guards
 * against on the server, where `??` would have turned every unlimited override
 * back into the plan's cap. The form keeps them apart so the mutation can.
 *
 * Sizes are typed in MB and stored in bytes. Decimal MB, matching the storage
 * meter in the app — an operator setting 500 and an owner reading 524 would be
 * the same disagreement in two places.
 */
const MB = 1_000_000

export type LimitValue = number | null | undefined

export function LimitField({
  label,
  value,
  onChange,
  unit,
  unlimitedLabel,
  inheritLabel,
  inheritable = false,
}: {
  /** Omit inside a SettingRow, which draws the label itself. */
  label?: string
  value: LimitValue
  onChange: (next: LimitValue) => void
  /** "MB" turns the box into a size field; absent means a plain count. */
  unit?: string
  unlimitedLabel: string
  inheritLabel: string
  inheritable?: boolean
}) {
  const unlimited = value === null
  const inherited = value === undefined
  const shown =
    typeof value === "number"
      ? unit === undefined
        ? String(value)
        : String(Math.round(value / MB))
      : ""

  return (
    <div className="flex flex-col gap-1.5">
      {label !== undefined && (
        <label className="text-sm font-medium">{label}</label>
      )}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          dir="ltr"
          className="w-32"
          value={shown}
          disabled={unlimited}
          // An empty box means "from the plan" where that is a state, and zero
          // where it is not — a plan limit cannot be absent, only 0 or
          // unlimited.
          placeholder={inheritable ? inheritLabel : undefined}
          onChange={(event) => {
            const raw = event.target.value
            if (raw === "") {
              onChange(inheritable ? undefined : 0)
              return
            }
            const parsed = Number(raw)
            if (Number.isNaN(parsed) || parsed < 0) {
              return
            }
            onChange(unit === undefined ? Math.round(parsed) : parsed * MB)
          }}
        />
        {unit !== undefined && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
        <label className="ms-2 flex items-center gap-2 text-sm">
          <Checkbox
            checked={unlimited}
            onCheckedChange={(checked) =>
              onChange(checked === true ? null : inheritable ? undefined : 0)
            }
          />
          {unlimitedLabel}
        </label>
        {inheritable && !inherited && (
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => onChange(undefined)}
          >
            {inheritLabel}
          </button>
        )}
      </div>
    </div>
  )
}

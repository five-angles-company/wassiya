"use client"

import type { ComponentProps, ReactNode } from "react"

const CHROME =
  "bg-background rounded-field h-14 border-[1.5px] transition-[border-color,box-shadow]"
const VALID = "border-[color:var(--input)]"
const INVALID = "border-[color:var(--tone-attention)]"
const MONO = "font-mono text-[14.5px] font-semibold tracking-[.05em]"

/**
 * The app's one text input, replacing five hand-rolled ones — every one of them
 * somebody typing a code they cannot afford to get wrong.
 *
 * `sand-50` is lighter than every surface it sits on, which is the oldest signal
 * a field has, and the border is `--input` so a field's edge is the same
 * decision as every other edge on the page. The radius is 16px rather than a
 * pill: a fully rounded input in a form reads as a search box.
 *
 * Focus is a ring, not a hue swap. A border that merely changes colour is
 * invisible to anyone not already watching that edge — exactly the keyboard user
 * tab has just moved somewhere they were not looking.
 *
 * `mono` sets the LTR direction and the monospace face together, because those
 * always travel as a pair: a Latin machine string left to inherit RTL reorders
 * under the bidi algorithm and can no longer be read back or copied accurately.
 * Nothing else in the shape changes — a code input that looked different from a
 * name input was telling the reader something untrue about how much it mattered.
 *
 * ## `action` puts the control inside the field
 *
 * A button beside a field is a second object: the two never agree on height
 * (`md` is 44px against this 52px) and the reader has to work out that they
 * belong together. Inside, sharing one border and one focus ring, it is one
 * control — which is what "type this and check it" actually is. The ring moves
 * to `focus-within` so tabbing into either half lights the whole thing.
 */
export function TextInput({
  mono = false,
  invalid = false,
  action,
  className,
  ...props
}: {
  /** A machine string: LTR, monospace, loosely tracked. */
  mono?: boolean
  invalid?: boolean
  /** A control rendered inside the field's box, at the end. */
  action?: ReactNode
} & Omit<ComponentProps<"input">, "className"> & { className?: string }) {
  const shared = {
    dir: mono ? ("ltr" as const) : undefined,
    spellCheck: mono ? false : undefined,
    autoComplete: mono ? "off" : undefined,
    autoCapitalize: mono ? "characters" : undefined,
    "aria-invalid": invalid || undefined,
  }

  if (action === undefined) {
    return (
      <input
        {...shared}
        className={`${CHROME} ${invalid ? INVALID : VALID} placeholder:text-muted-foreground w-full px-4 text-[16px] outline-none focus-visible:border-[color:var(--primary)] focus-visible:ring-4 focus-visible:ring-[color:var(--ring)]/25 ${mono ? MONO : ""} ${className ?? ""}`}
        {...props}
      />
    )
  }

  return (
    <div
      className={`${CHROME} ${invalid ? INVALID : VALID} flex w-full items-center focus-within:border-[color:var(--primary)] focus-within:ring-4 focus-within:ring-[color:var(--ring)]/25 ${className ?? ""}`}
    >
      <input
        {...shared}
        className={`placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent px-4 text-[15.5px] outline-none ${mono ? MONO : ""}`}
        {...props}
      />
      <div className="shrink-0 pe-1.5">{action}</div>
    </div>
  )
}

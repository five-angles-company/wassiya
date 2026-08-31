"use client"

import type { ComponentProps } from "react"

/**
 * The app's one text input.
 *
 * ## Why this exists
 *
 * Five screens had hand-rolled one: `h-[62px]` pills bordered in `primary` on
 * the box gate, in `secondary` on the handover, `h-[58px]` with a hairline on
 * the key page — and `Field`, which had been redesigned and matched none of
 * them. Every one of those is somebody typing a code they cannot afford to get
 * wrong, on screens they reach minutes apart.
 *
 * ## The shape says "type here"
 *
 * `sand-50` is lighter than every surface it sits on, which is the oldest and
 * most reliable signal a field has. The border is `sand-300` because 16% ink
 * does not resolve against either the page or a card. And the radius is 16px,
 * not a pill: a fully rounded input in a form reads as a search box.
 *
 * ## Focus is a ring, not a hue swap
 *
 * A border that merely changes colour is invisible to anyone who was not
 * already watching that edge — which is exactly the keyboard user tab has just
 * moved somewhere they were not looking.
 *
 * ## `mono`
 *
 * A recovery code, a key half, a claim reference. It sets the LTR direction and
 * the monospace face together, because those two always travel as a pair: a
 * Latin machine string left to inherit RTL reorders under the bidi algorithm
 * and can no longer be read back or copied accurately. Nothing else in the
 * shape changes — a code input that looked different from a name input was
 * telling the reader something untrue about how much it mattered.
 */
export function TextInput({
  mono = false,
  invalid = false,
  className,
  ...props
}: {
  /** A machine string: LTR, monospace, loosely tracked. */
  mono?: boolean
  invalid?: boolean
} & Omit<ComponentProps<"input">, "className"> & { className?: string }) {
  return (
    <input
      dir={mono ? "ltr" : undefined}
      spellCheck={mono ? false : undefined}
      autoComplete={mono ? "off" : undefined}
      autoCapitalize={mono ? "characters" : undefined}
      aria-invalid={invalid || undefined}
      className={`bg-sand-50 placeholder:text-sand-500 h-[52px] w-full rounded-2xl border-[1.5px] px-4 text-[15.5px] outline-none transition-[border-color,box-shadow] focus-visible:border-[color:var(--primary)] focus-visible:ring-4 focus-visible:ring-[color:var(--color-terracotta-200)] ${
        invalid ? "border-terracotta-700" : "border-sand-300"
      } ${mono ? "font-mono text-[14.5px] font-semibold tracking-[.05em]" : ""} ${className ?? ""}`}
      {...props}
    />
  )
}

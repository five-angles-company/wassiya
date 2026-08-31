import type { ComponentProps, ReactNode } from "react"
import Link from "next/link"

/**
 * The app's one button.
 *
 * ## Why this exists
 *
 * It did not, and the cost was measurable: primary actions had shipped at
 * `h-14`, `h-[58px]`, `h-[54px]`, `py-3` and `py-3.5` across nine screens,
 * because every screen invented its own. A shared primitive is the only thing
 * that keeps them equal — a rule written down is a rule the next screen breaks.
 *
 * ## Sizes are roles, not measurements
 *
 * `lg` is the board's 56px primary: the single action a screen exists for, and
 * a screen has at most one. `md` is everything else that commits — a submit
 * inside a panel, a confirm. `sm` is chrome: a corner button beside a heading,
 * a "load more".
 *
 * The heading face is on `lg` alone. At 44px and below Cairo 800 reads as
 * shouting, and the label is doing a different job there anyway.
 *
 * ## Disabled is surface-toned, never a faded primary
 *
 * AGENTS.md says so directly, and the reason is visible: terracotta at half
 * opacity over sand is a muddy peach that reads as broken rather than as
 * not-yet. `aria-disabled` rather than only `disabled`, so the control stays
 * in the tab order and a screen reader announces *why* nothing happened.
 */
type Variant = "primary" | "secondary" | "outline" | "ghost"
type Size = "lg" | "md" | "sm"

const SIZE: Record<Size, string> = {
  lg: "h-14 px-8 text-[16.5px] font-heading font-extrabold gap-3",
  md: "h-11 px-6 text-[14.5px] font-semibold gap-2",
  sm: "h-9 px-4 text-[13.5px] font-semibold gap-2",
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-terracotta-600 shadow-[var(--shadow-raised)]",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-olive-600 shadow-[var(--shadow-raised)]",
  outline: "border border-border hover:bg-sand-100",
  ghost: "text-sand-700 hover:text-foreground hover:bg-sand-100",
}

const BASE =
  "inline-flex shrink-0 items-center justify-center rounded-full whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]"

const DISABLED = "bg-muted text-muted-foreground cursor-not-allowed shadow-none"

function classesFor(variant: Variant, size: Size, disabled: boolean): string {
  return `${BASE} ${SIZE[size]} ${disabled ? DISABLED : VARIANT[variant]}`
}

export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  children,
  ...props
}: {
  variant?: Variant
  size?: Size
  children: ReactNode
} & Omit<ComponentProps<"button">, "className"> & { className?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={`${classesFor(variant, size, disabled)} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * The same button as a link.
 *
 * Separate rather than an `asChild` slot: `next/link` needs a real `href` and
 * prefetches on its own, and a polymorphic `as` prop would let a call site ship
 * an anchor with an `onClick` and no destination — which is the commonest way a
 * button-shaped link stops working with the keyboard.
 */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  href: string
  variant?: Variant
  size?: Size
  children: ReactNode
} & Omit<ComponentProps<typeof Link>, "href" | "className"> & {
    className?: string
  }) {
  return (
    <Link
      href={href}
      className={`${classesFor(variant, size, false)} ${className ?? ""}`}
      {...props}
    >
      {children}
    </Link>
  )
}

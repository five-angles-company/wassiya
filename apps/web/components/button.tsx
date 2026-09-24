import type { ComponentProps, ReactNode } from "react"
import Link from "next/link"

import {
  buttonClasses,
  type ButtonSize as Size,
  type ButtonVariant as Variant,
} from "@workspace/ui/lib/wassiya-button"

/**
 * The app's one button — primary actions had shipped at `h-14`, `h-[58px]`,
 * `h-[54px]`, `py-3` and `py-3.5` across nine screens before it existed. The
 * classes, and the rules for sizes and the disabled state, live in
 * `@workspace/ui/lib/wassiya-button`, shared with the landing site.
 *
 * `aria-disabled` rather than only `disabled`, so the control stays in the tab
 * order and a screen reader announces why nothing happened.
 */
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
      className={`${buttonClasses(variant, size, disabled)} ${className ?? ""}`}
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
      className={`${buttonClasses(variant, size)} ${className ?? ""}`}
      {...props}
    >
      {children}
    </Link>
  )
}

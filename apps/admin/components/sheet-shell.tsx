"use client"

import type { ReactNode } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"

import { useLocale } from "@/components/locale-provider"

/**
 * Every side sheet in the console, from one shape.
 *
 * Seven sheets had drifted into seven layouts: five body wrappers, four places
 * to put a save button, three ways to style a destructive one, and exactly one
 * that flipped to the correct side in Arabic. None of that was a decision —
 * each sheet was written next to the screen it belonged to and nothing held
 * them together. This is what holds them together.
 *
 * The identity, and the reasons:
 *
 * - **It opens on the reading side.** `side` follows the locale, like the
 *   sidebar: in Arabic the console reads from the right, so a panel that slides
 *   in from the right covers the navigation instead of the content.
 * - **Header, body, footer — and the header always has a rule under it.** The
 *   same three bands a `TableCard` has, at the same `p-4`, so a sheet reads as
 *   a panel of this console rather than as a different product.
 * - **Only the body scrolls.** The title stays put, and a form's commit stays
 *   on screen instead of being somewhere below the fold.
 * - **Actions live in the footer, never in the body.** One place to look for
 *   "what can I do here", which is what makes a sheet skimmable.
 *
 * Three widths and no more: `md` for a form, `lg` for a form with a list in it,
 * `xl` for a record with sections.
 */
const WIDTH = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
} as const

export function SheetShell({
  open,
  onOpenChange,
  size = "md",
  title,
  badge,
  description,
  trigger,
  footer,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  size?: keyof typeof WIDTH
  title: string
  /** A status `Badge` beside the title. Record sheets carry one; forms do not. */
  badge?: ReactNode
  /** One line under the title. Always supplied: it is the accessible name's mate. */
  description: ReactNode
  /**
   * Present when the sheet owns its own opening — a row button, a toolbar
   * button. Absent when a parent drives `open` from the selected record.
   */
  trigger?: ReactNode
  /**
   * The action bar. Put the primary action last; give a secondary or
   * destructive one `className="me-auto"` so it sits at the far start, away
   * from the button somebody means to press.
   */
  footer?: ReactNode
  children: ReactNode
}) {
  const locale = useLocale()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger !== undefined && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        className={cn("flex w-full flex-col gap-0 p-0", WIDTH[size])}
      >
        {/* `pe-12` keeps the title clear of the close button the primitive
            pins to the top corner. */}
        <SheetHeader className="gap-1.5 border-b p-4 pe-12">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle>{title}</SheetTitle>
            {badge}
          </div>
          <SheetDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer !== undefined && (
          <SheetFooter className="flex-row items-center justify-end gap-2 border-t p-4">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

/** A form's body: one column, one gap, one padding. */
export function SheetBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4 p-4", className)}>{children}</div>
  )
}

/**
 * A record's body: sections separated by a hairline, each paying its own
 * padding. The rule between them is what a record sheet has instead of cards.
 */
export function SheetSections({ children }: { children: ReactNode }) {
  return <div className="divide-y">{children}</div>
}

export function SheetSection({
  title,
  action,
  children,
}: {
  title: string
  /** A ghost button at the far end of the heading row. */
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 p-4">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

/** A labelled control. The one field shape; `gap-1.5`, label above. */
export function SheetField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint !== undefined && (
        <span className="text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  )
}

/**
 * A read-only datum: caption, then value.
 *
 * `numeric` is not styling for its own sake — a number or an address is a
 * machine string, and it stays LTR and unshaped inside Arabic prose or bidi
 * reordering mangles it.
 */
export function SheetValue({
  caption,
  value,
  numeric = false,
  tone,
}: {
  caption: string
  value: ReactNode
  numeric?: boolean
  tone?: "bad"
}) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="text-xs text-muted-foreground">{caption}</span>
      <span
        className={cn(
          "font-medium",
          numeric && "tabular-nums",
          tone === "bad" && "text-destructive"
        )}
        dir={numeric ? "ltr" : undefined}
      >
        {value}
      </span>
    </p>
  )
}

/**
 * A bordered list of tickable things — roles, permissions.
 *
 * Three sheets had built this by hand, two of them character-identical and the
 * third two pixels apart.
 */
export function CheckboxList({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col divide-y rounded-lg border">{children}</div>
  )
}

export function CheckboxRow({
  control,
  title,
  subtitle,
  subtitleDir,
}: {
  /** The `Checkbox` itself, so the caller owns its state. */
  control: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  /** `ltr` for a subtitle that is a key or an address rather than prose. */
  subtitleDir?: "ltr"
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm">
      <span className="mt-0.5 flex">{control}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium">{title}</span>
        {subtitle !== undefined && (
          <span
            dir={subtitleDir}
            className={cn(
              "truncate text-xs text-muted-foreground",
              subtitleDir === "ltr" && "font-mono text-[11px]"
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
    </label>
  )
}

/** The separator in a header's metadata line. */
export function SheetDot() {
  return <span aria-hidden>·</span>
}

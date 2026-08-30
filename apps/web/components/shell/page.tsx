import { cn } from "@workspace/ui/lib/utils"

/**
 * One container, three widths.
 *
 * Before this there were four ad-hoc max-widths and no agreement between a
 * page and its own header: `ClaimBrand` was hard-coded `max-w-5xl` while the
 * stepper and the heir box put their bodies in `max-w-3xl`, so on a wide screen
 * the mark and the language toggle floated about 8rem outside the column they
 * were supposed to be heading. Header and body agreed on two screens out of six.
 *
 * `prose` is measured in characters rather than pixels because it exists for
 * running text, and the thing that makes running text readable is line length,
 * not viewport fraction.
 */
const WIDTHS = {
  prose: "max-w-[68ch]",
  narrow: "max-w-3xl",
  default: "max-w-5xl",
} as const

export function Page({
  width = "default",
  className,
  children,
}: {
  width?: keyof typeof WIDTHS
  className?: string
  children: React.ReactNode
}) {
  return (
    <main
      id="content"
      className={cn(
        "mx-auto w-full px-5 pt-10 pb-4 md:px-8 md:pt-14",
        WIDTHS[width],
        className
      )}
    >
      {children}
    </main>
  )
}

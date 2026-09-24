/**
 * The Wassiya button's classes, shared by `apps/web` (`components/button.tsx`)
 * and `apps/landing` (`ButtonLink.astro`) so the two surfaces cannot drift.
 *
 * Sizes are roles, not measurements. `lg` is the 56px primary: the single
 * action a screen exists for, and a screen has at most one. `md` is everything
 * else that commits. `sm` is chrome. The heading face is on `lg` alone, because
 * at 44px and below Cairo 800 reads as shouting.
 *
 * **Disabled is surface-toned, never a faded primary**: terracotta at half
 * opacity over sand is a muddy peach that reads as broken rather than not-yet.
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost"
export type ButtonSize = "lg" | "md" | "sm"

const SIZE: Record<ButtonSize, string> = {
  lg: "h-14 px-8 text-[16.5px] font-heading font-extrabold gap-3",
  md: "h-11 px-6 text-[14.5px] font-semibold gap-2",
  sm: "h-9 px-4 text-[13.5px] font-semibold gap-2",
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-95 shadow-[var(--shadow-raised)]",
  secondary:
    "bg-secondary text-secondary-foreground hover:brightness-95 shadow-[var(--shadow-raised)]",
  outline: "border border-border hover:bg-muted",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
}

const BASE =
  "inline-flex shrink-0 items-center justify-center rounded-full whitespace-nowrap transition-[color,background-color,filter] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]"

const DISABLED = "bg-muted text-muted-foreground cursor-not-allowed shadow-none"

export function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled = false
): string {
  return `${BASE} ${SIZE[size]} ${disabled ? DISABLED : VARIANT[variant]}`
}

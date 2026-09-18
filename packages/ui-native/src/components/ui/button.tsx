import { TextClassContext } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable } from 'react-native';

/**
 * Wassiya buttons are pills with Cairo 800 labels — see the
 * screen grammar: "54px primary CTA at 17px, 50px secondary, 46px inline".
 *
 * Two rules this file follows deliberately:
 *
 *  - **Pressed states name a ramp step, never `/alpha`.** In this stack the
 *    theme colors are declared `unset` at build time and resolved per-theme at
 *    runtime, so `bg-primary/90` compiles to `colorMix("unset", 90%, …)` and
 *    renders nothing. `active:bg-terracotta-600` is the same intent, one step
 *    down the ramp, and actually works.
 *  - **There is no red.** `destructive` is an outlined confirm in deep
 *    terracotta: "this palette has no red and doesn't need one."
 */
const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-full shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        /** Terracotta — the single action that moves the user forward. */
        default: cn(
          'bg-primary active:bg-terracotta-600 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-terracotta-600' })
        ),
        /** Olive — confirmation and protection ("أنا بخير", "تأكيد"). */
        protect: cn(
          'bg-secondary active:bg-olive-600 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-olive-600' })
        ),
        /** Alias of `protect`, kept so upstream `ui/` markup still works. */
        secondary: cn(
          'bg-secondary active:bg-olive-600 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-olive-600' })
        ),
        /** Quiet second choice next to a primary CTA. */
        outline: cn(
          'border-border active:bg-muted border bg-transparent',
          Platform.select({ web: 'hover:bg-muted' })
        ),
        /** Tertiary — a text action with a press target. */
        ghost: cn(
          'active:bg-terracotta-100 bg-transparent',
          Platform.select({ web: 'hover:bg-terracotta-100' })
        ),
        /** Outlined confirm for deletions. Deep terracotta, never red. */
        destructive: cn(
          'border-sand-400 active:bg-terracotta-100 border bg-transparent',
          Platform.select({ web: 'hover:bg-terracotta-100' })
        ),
        link: 'bg-transparent',
      },
      size: {
        /** 54px — the primary CTA at the bottom of a screen. */
        default: 'h-13.5 px-6',
        /** 56px — hero CTA and the floating action button. */
        lg: 'h-14 px-7',
        /** 50px — secondary CTA, matches the 50px field height. */
        sm: 'h-12.5 px-5',
        /** 46px — inline actions inside a card ("لصق", "مسح QR"). */
        xs: 'h-11.5 px-4',
        /** 40px — the round back / overflow buttons in a header row. */
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    // `line-clamp-1`, because a button label is one line and a pill is a fixed
    // height. Without it "تسجيل الدخول" broke across two lines inside ١.١'s 50dp
    // secondary and the second line rendered *below* the border — measured, not
    // guessed: the label came out 95dp wide inside a 326dp button, so it was
    // never short of room. RN wrapped it anyway.
    //
    // It compiles to `overflow: hidden` + `display: flex` + box-orient, **not**
    // to `numberOfLines` — verified in the bundle. The clamp is what keeps the
    // label on one line here, and clipping is the right failure mode for a
    // label too long for its pill: a button that grows a second line breaks the
    // layout around it, where a clipped one only looks tight.
    'font-heading-extrabold line-clamp-1',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        /**
         * `background` (#f5ead8), not `primary-foreground` (#fff2eb).
         *
         * Label-on-terracotta is the page ground,
         * and `primary-cta` has always drawn it that way — this variant was the
         * one filled button in the product using the other white. The two are
         * close enough to look like a rendering artefact rather than a choice,
         * which is exactly how it read on ١.١'s "ابدأ الآن".
         */
        default: 'text-background',
        protect: 'text-secondary-foreground',
        secondary: 'text-secondary-foreground',
        outline: 'text-foreground',
        ghost: 'text-terracotta-700',
        destructive: 'text-terracotta-800',
        link: cn(
          'text-terracotta-700 group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
      },
      /**
       * Sizes, and **no line height**.
       *
       * The type scale pairs every size with a leading meant for running text
       * — `--text-title` is 17px at 1.2, so 20.4px. Cairo 800's own line box at
       * 17px is taller than that, and forcing the smaller value pushes the
       * glyphs off centre inside a fixed-height pill: the label sits high, and
       * on Arabic it clips the marks that hang below the baseline.
       *
       * A button label is one line centred in a pill by `items-center`, so it
       * wants a size and nothing else. `primary-cta` has always written it as a
       * bare `text-[17px]` for this reason; these are the same numbers the
       * tokens carry, minus the leading.
       */
      size: {
        default: 'text-[17px]',
        lg: 'text-[17px]',
        sm: 'text-[14.5px]',
        xs: 'text-[13.5px]',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };

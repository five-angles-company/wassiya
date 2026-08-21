import { monoFont } from '@workspace/ui-native/lib/fonts';
import { cn } from '@workspace/ui-native/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

/**
 * Every variant names an explicit font FAMILY utility rather than a weight.
 * React Native registers each weight as its own family, so `font-bold` would
 * synthesise a fake bold instead of selecting Cairo 800 — see
 * `apps/mobile/src/global.css`.
 *
 * The first block is the Wassiya scale from the design board; the second keeps
 * the upstream shadcn variant names working, retuned to the same type stack.
 */
const textVariants = cva(
  cn(
    'text-foreground font-body text-body',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: '',

        // -- Wassiya scale ---------------------------------------------------
        /** Hero numerals and one-word statements. */
        display: 'font-heading-black text-display',
        /** Tab-root screen title ("أصولك"). */
        screenTitle: 'font-heading-extrabold text-screen',
        /** Sub-page / pushed-route title. */
        pageTitle: 'font-heading-extrabold text-page',
        /** Card and section titles. */
        title: 'font-heading-extrabold text-title',
        /** Dialog and bottom-sheet titles. */
        dialogTitle: 'font-heading-extrabold text-dialog',
        /** Bold label above a group inside a card. */
        sectionLabel: 'font-body-bold text-section',
        /** The title line of a notice / alert banner. */
        noticeTitle: 'font-body-bold text-notice',
        /** The primary line of a list row. */
        rowTitle: 'font-body-semibold text-row',
        /** Secondary line under a row title. */
        meta: 'text-meta',
        /** The smallest supporting line; already dimmed. */
        metaSm: 'text-muted-foreground text-metasm',
        /** Inline text action ("الكل", "تعديل"). */
        action: 'text-terracotta-700 font-body-semibold text-action',
        /**
         * All-caps eyebrow. Plex, not Figtree: kickers carry Arabic
         * ("رمز الاسترداد") and Figtree has no Arabic glyphs, so a Latin face
         * here falls back to the system font silently. Tracking is applied by
         * the caller, in Latin only.
         */
        kicker: 'text-muted-foreground font-body-semibold text-kicker',

        // -- Upstream shadcn names, retuned ---------------------------------
        h1: 'font-heading-extrabold text-h1',
        h2: 'font-heading-extrabold text-screen',
        h3: 'font-heading-extrabold text-page',
        h4: 'font-heading-bold text-title',
        p: 'text-body',
        blockquote: 'border-border ps-3 border-s-2 italic',
        code: cn(monoFont, 'bg-muted rounded-xs px-1.5 py-0.5 text-meta'),
        lead: 'text-muted-foreground text-page',
        large: 'font-body-semibold text-title',
        small: 'font-body-medium text-meta',
        muted: 'text-muted-foreground text-meta',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  display: 'heading',
  screenTitle: 'heading',
  pageTitle: 'heading',
  title: 'heading',
  dialogTitle: 'heading',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  display: '1',
  screenTitle: '1',
  pageTitle: '2',
  dialogTitle: '2',
  title: '3',
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext, textVariants };

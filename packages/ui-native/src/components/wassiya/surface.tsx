import { TONE_SOFT_BG, type Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import type * as React from 'react';
import { View } from 'react-native';

/**
 * The one filled, rounded block this product draws — it replaced 15 distinct
 * `rounded-card bg-card …` strings and 12 distinct `rounded-row …` strings
 * describing about four actual shapes.
 *
 * **The radius is a role, not a number.** A list `row` is 24px, a content `card`
 * 26px, a `summary` block 28px — near enough to look like sloppiness in a diff
 * and far enough to read as hierarchy on glass, which is exactly why they are
 * named. `as="row"` states the role so nobody has to remember the two pixels.
 *
 * This is **not** a revival of `ui/card.tsx`, which has zero imports and stays
 * that way: it is upstream shadcn kept byte-diffable against the registry, its
 * Header/Title/Content/Footer split does not match how anything here is built,
 * and it has no notion of these role radii.
 */
export type SurfaceProps = {
  children?: React.ReactNode;
  /** The board's role radii: row 24 · card 26 · summary 28. */
  as?: 'row' | 'card' | 'summary';
  /**
   * `card` is the neutral sand fill. The three tones are the semantic ones
   * from `lib/tone.ts` — olive = done, terracotta = attention, sand = inert —
   * so a tinted block can never drift from what that colour means elsewhere.
   */
  tone?: 'card' | Tone;
  /** Vertical rhythm between children. */
  gap?: 'none' | 'tight' | 'normal' | 'loose';
  /**
   * Off for a block whose children draw their own padding — a settings list
   * where each row needs to be pressable edge to edge. Pairs with `clip`.
   */
  padded?: boolean;
  /** Clips children to the radius. Needed whenever `padded` is false. */
  clip?: boolean;
  /** Lays children out horizontally and centres them on the cross axis. */
  row?: boolean;
  className?: string;
};

const RADIUS = {
  row: 'rounded-row',
  card: 'rounded-card',
  summary: 'rounded-summary',
} as const;

const GAP = {
  none: '',
  tight: 'gap-1.5',
  normal: 'gap-3',
  loose: 'gap-4',
} as const;

/**
 * Static lookup maps, never interpolation.
 *
 * Tailwind reads class names by scanning source text, so a composed string
 * (`` `rounded-${as}` ``) is invisible to it and the utility is silently
 * dropped from the bundle — no error, no warning, just a block with square
 * corners at runtime. Every variant in this file has to appear literally
 * somewhere above.
 */
export function Surface({
  children,
  as = 'card',
  tone = 'card',
  gap = 'normal',
  padded = true,
  clip = false,
  row = false,
  className,
}: SurfaceProps) {
  return (
    <View
      className={cn(
        RADIUS[as],
        tone === 'card' ? 'bg-card' : TONE_SOFT_BG[tone],
        GAP[gap],
        padded && (row ? 'px-4 py-3.5' : 'p-4'),
        clip && 'overflow-hidden',
        row && 'flex-row items-center',
        className
      )}
    >
      {children}
    </View>
  );
}

/**
 * The product's semantic colour rule, in one place.
 *
 * The semantic rule: **olive = verified / safe / done**, **terracotta =
 * action / attention**, **sand = pending / inert**. Every status surface in the
 * app — pills, banners, timeline nodes, checklists — reads from these maps, so
 * "confirmed" is the same green everywhere and re-tinting the system is a
 * single-file edit.
 *
 * Note the classes below always name an explicit ramp step. Alpha modifiers
 * (`bg-primary/90`) do not work against theme colours in this stack: they
 * compile to `colorMix("unset", …)` because the theme variables are resolved
 * at runtime, not at build time.
 */
export type Tone = 'olive' | 'terracotta' | 'sand';

/** Tinted fill for a card, banner, or pill. */
export const TONE_SOFT_BG: Record<Tone, string> = {
  olive: 'bg-olive-100',
  terracotta: 'bg-terracotta-100',
  sand: 'bg-sand-200',
};

/** Text/icon colour that sits legibly on {@link TONE_SOFT_BG}. */
export const TONE_SOFT_FG: Record<Tone, string> = {
  olive: 'text-olive-800',
  terracotta: 'text-terracotta-800',
  sand: 'text-sand-800',
};

/** One step lighter than the soft fill — for a bar track or an inner well. */
export const TONE_TRACK_BG: Record<Tone, string> = {
  olive: 'bg-olive-200',
  terracotta: 'bg-terracotta-200',
  sand: 'bg-sand-300',
};

/** Saturated fill, for a filled bar, a checked disc, or a solid badge. */
export const TONE_SOLID_BG: Record<Tone, string> = {
  olive: 'bg-secondary',
  terracotta: 'bg-primary',
  sand: 'bg-sand-400',
};

/** Text/icon colour that sits legibly on {@link TONE_SOLID_BG}. */
export const TONE_SOLID_FG: Record<Tone, string> = {
  olive: 'text-secondary-foreground',
  terracotta: 'text-primary-foreground',
  sand: 'text-sand-900',
};

/** Mid-strength avatar / disc fill. */
export const TONE_DISC_BG: Record<Tone, string> = {
  olive: 'bg-olive-200',
  terracotta: 'bg-terracotta-200',
  sand: 'bg-sand-300',
};

/** Text colour that sits legibly on {@link TONE_DISC_BG}. */
export const TONE_DISC_FG: Record<Tone, string> = {
  olive: 'text-olive-900',
  terracotta: 'text-terracotta-900',
  sand: 'text-sand-900',
};

/** Hairline border matching the tone, for outlined blocks. */
export const TONE_BORDER: Record<Tone, string> = {
  olive: 'border-olive-300',
  terracotta: 'border-terracotta-300',
  sand: 'border-sand-300',
};

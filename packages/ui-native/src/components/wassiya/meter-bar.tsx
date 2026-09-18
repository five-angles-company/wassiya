import { TONE_SOLID_BG, TONE_TRACK_BG, type Tone } from '@workspace/ui-native/lib/tone';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

export type MeterSegment = {
  /** Share of the whole bar, 0–1. Segments are drawn in order. */
  value: number;
  tone: Tone;
  /** Stable key; also used as the accessibility label when present. */
  id: string;
  /**
   * Fill class, overriding the tone's default. Needed where a breakdown wants
   * a specific ramp step rather than the tone's canonical fill — the 9.4
   * storage bar puts "messages" on `sand-500`, not the sand tone's `sand-400`.
   */
  color?: string;
};

export type MeterBarProps = {
  /** Single-value form, 0–1. Ignored when `segments` is given. */
  value?: number;
  /** Stacked form — a breakdown by category (storage, routed assets). */
  segments?: MeterSegment[];
  tone?: Tone;
  /** 10px is the data bar; 7px is the onboarding step meter. */
  height?: 'step' | 'data';
  className?: string;
};

const HEIGHTS = { step: 'h-1.75', data: 'h-2.5' } as const;

const clamp = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

/**
 * The rounded progress bar used by the onboarding step meter, the "35 of 43
 * routed" strip and the storage breakdown.
 *
 * Deliberately not the shadcn `Progress` component: that one animates a single
 * translated track, which cannot express a stacked multi-tone breakdown, and
 * this bar has no indeterminate state to animate.
 *
 * Width is expressed as a flex ratio rather than a percentage string so the
 * segments stay exact under RTL — percentage offsets would need mirroring,
 * flex does not.
 */
export function MeterBar({
  value = 0,
  segments,
  tone = 'olive',
  height = 'data',
  className,
}: MeterBarProps) {
  const parts: MeterSegment[] = segments?.length
    ? segments.map((s) => ({ ...s, value: clamp(s.value) }))
    : [{ id: 'value', tone, value: clamp(value) }];

  const filled = parts.reduce((sum, part) => sum + part.value, 0);
  const remainder = Math.max(0, 1 - filled);

  return (
    <View
      className={cn(
        'w-full flex-row overflow-hidden rounded-full',
        HEIGHTS[height],
        TONE_TRACK_BG[tone],
        className
      )}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(filled * 100), min: 0, max: 100 }}>
      {parts.map((part) =>
        part.value > 0 ? (
          <View
            key={part.id}
            style={{ flexGrow: part.value }}
            className={part.color ?? TONE_SOLID_BG[part.tone]}
          />
        ) : null
      )}
      {remainder > 0 ? <View style={{ flexGrow: remainder }} /> : null}
    </View>
  );
}

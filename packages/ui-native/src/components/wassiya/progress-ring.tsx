import Svg, { Circle } from 'react-native-svg';

/**
 * A ring that fills as one file uploads.
 *
 * This sits on **each tile**, not in one bar across the album, and
 * says why: *"with twenty photos on a weak connection a single bar hides which
 * file failed."* An album-level bar answers "how far along is all of it"; the
 * only question worth answering here is "which one is stuck".
 *
 * ## Why SVG rather than a conic gradient
 *
 * The design draws it as `conic-gradient`, which React Native has no equivalent
 * for. A stroked circle with `strokeDasharray` is the same mark by other means,
 * and unlike a gradient it stays exact at any diameter.
 *
 * The arc starts at twelve o'clock — hence the -90° rotation — because a ring
 * that begins at three reads as already part-done.
 */
export type ProgressRingProps = {
  /** 0–1. Values outside are clamped rather than drawn as an over-full ring. */
  value: number;
  size?: number;
  /** Ring thickness. */
  stroke?: number;
  /** The filled arc. Defaults to the ground colour, for use over a scrim. */
  color?: string;
  /** The unfilled remainder. */
  trackColor?: string;
};

export function ProgressRing({
  value,
  size = 32,
  stroke = 3,
  color = '#f5ead8',
  trackColor = 'rgba(245, 234, 216, 0.25)',
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={trackColor}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
        // Twelve o'clock, not three.
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

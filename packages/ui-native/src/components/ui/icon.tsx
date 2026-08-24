import { TextClassContext } from '@workspace/ui-native/components/ui/text';
import { shouldFlipIcon } from '@workspace/ui-native/lib/rtl';
import { cn } from '@workspace/ui-native/lib/utils';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import { withUniwind } from 'uniwind';

type IconProps = LucideProps & {
  as: LucideIcon;
  /**
   * Mirror the glyph when the layout is RTL.
   *
   * For icons that mean "forward"/"back" rather than "left"/"right" —
   * chevrons, arrows, the reply glyph. Logical CSS properties mirror layout
   * but never the artwork inside an icon, so this has to be explicit.
   *
   * Do NOT set it on glyphs whose shape is meaningful in itself (a clock, a
   * fingerprint, a printer, a checkmark) — those read wrong reversed.
   */
  flip?: boolean;
} & React.RefAttributes<LucideIcon>;

/** Hoisted so the wrapper is not handed a new object on every render. */
const MIRROR = { transform: [{ scaleX: -1 }] } as const;

function IconImpl({ as: IconComponent, ...props }: IconProps) {
  return <IconComponent {...props} />;
}

const StyledIcon = withUniwind(IconImpl, {
  size: {
    fromClassName: 'className',
    styleProperty: 'width',
  },
  color: {
    fromClassName: 'className',
    styleProperty: 'color',
  },
});

/**
 * A wrapper component for Lucide icons with Uniwind `className` support via `withUniwind`.
 *
 * This component allows you to render any Lucide icon while applying utility classes
 * using `uniwind`. It avoids the need to wrap or configure each icon individually.
 *
 * @component
 * @example
 * ```tsx
 * import { ArrowRight } from 'lucide-react-native';
 * import { Icon } from '@workspace/ui-native/registry/components/ui/icon';
 *
 * <Icon as={ArrowRight} className="text-red-500 size-4" />
 * ```
 *
 * @param {LucideIcon} as - The Lucide icon component to render.
 * @param {string} className - Utility classes to style the icon using Uniwind.
 * @param {boolean} flip - Mirror the glyph under RTL (directional icons only).
 * @param {number} size - Icon size (overrides the size class).
 * @param {...LucideProps} ...props - Additional Lucide icon props passed to the "as" icon.
 */
function Icon({
  as: IconComponent,
  className,
  flip = false,
  // 2.75 is the Wassiya icon weight ("Lucide at stroke-width 2.75" in the
  // design system) — heavier and rounder than Lucide's 2. Set as a default
  // rather than repeated at every call site.
  strokeWidth = 2.75,
  style,
  ...props
}: IconProps) {
  const textClass = React.useContext(TextClassContext);
  const icon = (
    <StyledIcon
      as={IconComponent}
      className={cn('text-foreground size-5', textClass, className)}
      strokeWidth={strokeWidth}
      style={style}
      {...props}
    />
  );

  // The mirror goes on a WRAPPER, never on this icon's own `style`.
  //
  // `withUniwind` derives the `size` prop from the resolved className style
  // (`styleProperty: 'width'`). This component used to hand down
  // `[{ transform: [{ scaleX: -1 }] }, style]`, which replaced the style
  // uniwind reads — leaving it no width, so the glyph rendered at no size.
  // Silently: no error, no warning, just an empty circle where the back
  // chevron should be. It made every `flip`ped icon in the app invisible.
  if (!flip || !shouldFlipIcon()) return icon;
  return <View style={MIRROR}>{icon}</View>;
}

export { Icon };

import { Text, TextClassContext } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

/**
 * Tinted card treatments (a Wassiya addition to the upstream component).
 *
 * The 9.4 plan card is a terracotta-filled panel rather than a surface card —
 * a whole card carrying the accent, not a card with an accent inside it. Use
 * the `terracotta-divider` colour for rules drawn on it: an `/alpha` modifier
 * on a theme colour compiles to `colorMix("unset", …)` in this stack and
 * renders nothing.
 */
const CARD_TINTS = {
  terracotta: { box: 'bg-terracotta-200 rounded-summary border-transparent', text: 'text-terracotta-900' },
  olive: { box: 'bg-olive-100 rounded-summary border-transparent', text: 'text-olive-900' },
  sand: { box: 'bg-sand-200 rounded-summary border-transparent', text: 'text-sand-900' },
} as const;

export type CardTint = keyof typeof CARD_TINTS;

/**
 * Rule colour to use for a divider drawn INSIDE a tinted card, e.g.
 * `<View className={cn('h-px', CARD_TINT_DIVIDER.terracotta)} />`.
 *
 * The terracotta entry is a declared alpha token, not an `/alpha` modifier —
 * see the note above.
 */
export const CARD_TINT_DIVIDER: Record<CardTint, string> = {
  terracotta: 'bg-terracotta-divider',
  olive: 'bg-olive-300',
  sand: 'bg-sand-300',
};

function Card({
  className,
  tint,
  ...props
}: React.ComponentProps<typeof View> &
  React.RefAttributes<View> & {
    /** Fill the whole card with a ramp tint instead of the card surface. */
    tint?: CardTint;
  }) {
  const tinted = tint ? CARD_TINTS[tint] : undefined;
  return (
    <TextClassContext.Provider value={tinted?.text ?? 'text-card-foreground'}>
      <View
        className={cn(
          'bg-card border-border flex flex-col gap-6 rounded-xl border py-6 shadow-sm shadow-black/5',
          tinted?.box,
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function CardHeader({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-col gap-1.5 px-6', className)} {...props} />;
}

function CardTitle({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return (
    <Text
      ref={ref}
      role="heading"
      aria-level={3}
      className={cn('font-semibold leading-none', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return <Text className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function CardContent({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('px-6', className)} {...props} />;
}

function CardFooter({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn('flex flex-row items-center px-6', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

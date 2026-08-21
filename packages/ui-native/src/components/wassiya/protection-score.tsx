import { Text } from '@workspace/ui-native/components/ui/text';
import { fmtNum } from '@workspace/ui-native/lib/format';
import type { LabelledProps } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

const SIZES = {
  sm: { box: 'size-14.5', ring: 'border-[5px]', text: 'text-title' },
  lg: { box: 'size-18.5', ring: 'border-[7px]', text: 'text-h1' },
} as const;

export type ProtectionScoreProps = Omit<LabelledProps<never>, 'labels'> & {
  /** Protections currently live. */
  earned: number;
  /** Total protections in the model — five, at time of writing. */
  total: number;
  size?: keyof typeof SIZES;
  className?: string;
};

/**
 * The "٤/٥" protection chip.
 *
 * One score object drives three surfaces — this chip on Home, the checklist on
 * setup-complete, and the Protection Centre list — so they can never disagree
 * about how safe the vault is.
 *
 * The ring is a plain border rather than the board's conic gradient: React
 * Native has no conic gradient without pulling in SVG, and a partial arc adds
 * no information the fraction in the middle does not already carry. The border
 * colour still does the semantic work — olive once every protection is live,
 * sand while any are outstanding.
 */
export function ProtectionScore({
  earned,
  total,
  size = 'sm',
  locale = 'ar',
  className,
}: ProtectionScoreProps) {
  const dims = SIZES[size];
  const complete = total > 0 && earned >= total;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${earned}/${total}`}
      className={cn(
        'shrink-0 items-center justify-center rounded-full',
        dims.box,
        dims.ring,
        complete ? 'border-secondary' : 'border-sand-300',
        className
      )}>
      <Text className={cn('font-heading-extrabold', dims.text)}>
        {fmtNum(earned, locale)}
        <Text className="text-muted-foreground text-meta">{`/${fmtNum(total, locale)}`}</Text>
      </Text>
    </View>
  );
}

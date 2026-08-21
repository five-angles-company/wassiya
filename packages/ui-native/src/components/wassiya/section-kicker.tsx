import { Text } from '@workspace/ui-native/components/ui/text';
import { fmtNum } from '@workspace/ui-native/lib/format';
import type { LabelledProps, Locale } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

export type SectionKickerProps = Omit<LabelledProps<never>, 'labels'> & {
  /** Small all-caps eyebrow above the heading. */
  kicker?: string;
  /** The heading itself. */
  title: string;
  /** Optional step number, rendered in the locale's numerals ("٢ · ..."). */
  step?: number;
  /** Optional supporting line under the heading. */
  description?: string;
  className?: string;
};

/**
 * Section heading with an optional numbered prefix — the "٢ · تهيئة الخزنة"
 * pattern that opens each stage of the app.
 *
 * The step number is shaped to the locale (٢ in Arabic, 2 in English) and
 * joined with a middle dot; `title` is the only required piece.
 *
 * Letter-spacing on the kicker is applied in Latin only: tracking pulls Arabic
 * letters out of their joined forms and makes the word unreadable.
 */
export function SectionKicker({
  kicker,
  title,
  step,
  description,
  locale = 'ar',
  className,
}: SectionKickerProps) {
  const heading = step === undefined ? title : `${fmtNum(step, locale)} · ${title}`;
  return (
    <View className={cn('gap-1', className)}>
      {kicker ? (
        <Text variant="kicker" className={trackingFor(locale)}>
          {kicker}
        </Text>
      ) : null}
      <Text variant="pageTitle">{heading}</Text>
      {description ? <Text variant="meta" className="text-muted-foreground">{description}</Text> : null}
    </View>
  );
}

function trackingFor(locale: Locale): string | undefined {
  return locale === 'en' ? 'tracking-kicker uppercase' : undefined;
}

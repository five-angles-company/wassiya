import { Text } from '@workspace/ui-native/components/ui/text';
import {
  TimelineStep,
  type TimelineStepState,
} from '@workspace/ui-native/components/wassiya/timeline-step';
import { fmtNum } from '@workspace/ui-native/lib/format';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { View } from 'react-native';

type TimelineLabelKey = 'daysLeft';

const LABELS: LabelSet<TimelineLabelKey> = {
  daysLeft: { ar: 'يوماً متبقياً', en: 'days left' },
};

export type TimelineStepItem = {
  id: string;
  state: TimelineStepState;
  title: string;
  meta?: string;
  /**
   * Days remaining on this step. Rendered as a countdown chip under the title
   * — only meaningful on the `current` node.
   */
  daysRemaining?: number;
};

export type TimelineStepsProps = LabelledProps<TimelineLabelKey> & {
  steps: TimelineStepItem[];
  className?: string;
};

/**
 * The vertical escalation timeline: check-in escalation on the owner's side,
 * and the claim/veto sequence on the heir's side (report → notify → veto
 * window → guardian confirmation → release).
 *
 * The point of showing it is that these delays are a **feature**, not latency.
 * The veto window exists so a living owner can object, and someone reading
 * this page in the worst week of their life needs to see that the wait is
 * bounded and what ends it — hence the explicit countdown on the current node.
 */
export function TimelineSteps({ steps, locale = 'ar', labels, className }: TimelineStepsProps) {
  const t = resolveLabels(LABELS, labels, locale);
  return (
    <View className={cn(className)}>
      {steps.map((step, index) => (
        <TimelineStep
          key={step.id}
          state={step.state}
          title={step.title}
          meta={step.meta}
          last={index === steps.length - 1}>
          {step.daysRemaining !== undefined ? (
            <View className="bg-terracotta-100 mt-1.5 self-start rounded-full px-3 py-1">
              <Text className="text-terracotta-800 font-body-semibold text-meta">
                {`${fmtNum(step.daysRemaining, locale)} ${t.daysLeft}`}
              </Text>
            </View>
          ) : null}
        </TimelineStep>
      ))}
    </View>
  );
}

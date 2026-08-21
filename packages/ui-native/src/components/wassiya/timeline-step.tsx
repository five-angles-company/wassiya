import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check } from 'lucide-react-native';
import type * as React from 'react';
import { View } from 'react-native';

export type TimelineStepState =
  /** Already happened. Olive disc with a check. */
  | 'done'
  /** Happening now — the one step the reader is waiting on. */
  | 'current'
  /** Not started. Hollow, dimmed. */
  | 'future';

export type TimelineStepProps = {
  state: TimelineStepState;
  /** What happens at this step. */
  title: string;
  /** When: a date, a channel list, "asked after the window closes". */
  meta?: string;
  /** Hide the connector on the last node. */
  last?: boolean;
  /** Slot under the text — e.g. a countdown on the current node. */
  children?: React.ReactNode;
};

/**
 * One node in {@link TimelineSteps}.
 *
 * The rail is built from logical properties throughout, so the whole timeline
 * mirrors under RTL without any per-node handling: the node column simply
 * becomes the right-hand column in Arabic.
 */
export function TimelineStep({ state, title, meta, last, children }: TimelineStepProps) {
  return (
    <View className="flex-row gap-3.5">
      <View className="w-6.5 shrink-0 items-center">
        {state === 'done' ? (
          <View className="bg-secondary size-6 items-center justify-center rounded-full">
            <Icon as={Check} className="text-secondary-foreground size-3.5" strokeWidth={3.5} />
          </View>
        ) : (
          <View
            className={cn(
              'size-6 rounded-full border-[3px]',
              state === 'current' ? 'border-primary bg-background' : 'border-sand-400'
            )}
          />
        )}
        {!last ? (
          <View
            className={cn('w-0.5 flex-1', state === 'done' ? 'bg-olive-300' : 'bg-border')}
          />
        ) : null}
      </View>

      <View className={cn('flex-1 gap-0.5', !last && 'pb-4.5', state === 'future' && 'opacity-55')}>
        <Text
          className={cn(
            'text-row',
            state === 'current' ? 'text-terracotta-800 font-body-bold' : 'font-body-semibold'
          )}>
          {title}
        </Text>
        {meta ? <Text variant="metaSm">{meta}</Text> : null}
        {children}
      </View>
    </View>
  );
}

import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { fmtNum } from '@workspace/ui-native/lib/format';
import { resolveLabels, type LabelledProps, type LabelSet } from '@workspace/ui-native/lib/labels';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type ChecklistLabelKey = 'lastStep' | 'progress';

const LABELS: LabelSet<ChecklistLabelKey> = {
  lastStep: { ar: 'خطوة أخيرة', en: 'last step' },
  progress: { ar: 'اكتمل', en: 'complete' },
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  onPress?: () => void;
};

export type ChecklistCardProps = LabelledProps<ChecklistLabelKey> & {
  title: string;
  items: ChecklistItem[];
  className?: string;
};

/**
 * The persistent onboarding checklist — "٣/٤ · خطوة أخيرة".
 *
 * The counter is generated from `items`, never passed in, so the header and
 * the rows can never drift apart. When exactly one item remains, the header
 * switches to "last step": the single most effective nudge in the whole
 * onboarding is telling someone they are one action from done.
 */
export function ChecklistCard({
  title,
  items,
  locale = 'ar',
  labels,
  className,
}: ChecklistCardProps) {
  const t = resolveLabels(LABELS, labels, locale);
  const done = items.filter((item) => item.done).length;
  const remaining = items.length - done;
  const suffix = remaining === 1 ? t.lastStep : t.progress;

  return (
    <View className={cn('bg-card border border-border gap-3 rounded-card p-4', className)}>
      <View className="flex-row items-baseline gap-2.5">
        <Text variant="sectionLabel" className="flex-1">
          {title}
        </Text>
        <Text variant="metaSm">
          {`${fmtNum(done, locale)}/${fmtNum(items.length, locale)} · ${suffix}`}
        </Text>
      </View>

      <View className="gap-2.5">
        {items.map((item) => {
          const Row = item.onPress ? Pressable : View;
          return (
            <Row
              key={item.id}
              onPress={item.onPress}
              accessibilityRole={item.onPress ? 'button' : undefined}
              accessibilityState={{ checked: item.done }}
              className="flex-row items-center gap-2.75">
              {item.done ? (
                <View className="bg-secondary size-4.5 shrink-0 items-center justify-center rounded-full">
                  <Icon as={Check} className="text-secondary-foreground size-3" strokeWidth={3.5} />
                </View>
              ) : (
                <View className="border-sand-500 size-4.5 shrink-0 rounded-full border-[2.75px]" />
              )}
              <Text
                className={cn(
                  'flex-1 text-meta',
                  item.done ? 'text-muted-foreground' : 'text-foreground'
                )}>
                {item.label}
              </Text>
            </Row>
          );
        })}
      </View>
    </View>
  );
}

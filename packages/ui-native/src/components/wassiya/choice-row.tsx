import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { Sheet } from '@workspace/ui-native/components/wassiya/sheet';
import type { SheetSelectOption } from '@workspace/ui-native/components/wassiya/sheet-select';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, ChevronRight } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

/**
 * A single choice, as a row.
 *
 * The row-shaped counterpart of `SheetSelect`, which is a *field*: a label
 * stacked above a bordered 12.5-high box. Dropped into a grouped list that box
 * is a third surface inside the second one, and the row rhythm breaks around
 * it. This renders at `SettingsRow`'s metrics instead — `py-3.5`, `gap-3`, no
 * horizontal padding — so a disposition, a country or a network sits in the
 * same list as the fields it belongs with.
 *
 * The sheet itself is `SheetSelect`'s, markup and all, so the two cannot drift
 * into two different ways of choosing one thing. Only the trigger differs, and
 * the trigger is the entire point.
 *
 * `placeholder` shows when nothing is chosen. That is a real state here rather
 * than a defensive one: ٤.٧ deliberately ships no default disposition, because
 * the board asks for that choice to be made rather than guessed.
 */
export type ChoiceRowProps = {
  /** Row label, and the sheet's own heading. */
  label: string;
  value: string | null;
  options: SheetSelectOption[];
  onChange: (value: string) => void;
  /** Shown in the value slot when nothing is chosen yet. */
  placeholder?: string;
  /** Tint the value — for a choice the screen is still waiting on. */
  tone?: 'default' | 'action';
  divider?: boolean;
  className?: string;
};

export function ChoiceRow({
  label,
  value,
  options,
  onChange,
  placeholder = '—',
  tone = 'default',
  divider,
  className,
}: ChoiceRowProps) {
  const sheet = useRef<TrueSheet>(null);
  const selected = options.find((option) => option.value === value) ?? null;

  const choose = async (next: string) => {
    onChange(next);
    // Dismiss after committing, so the row behind the sheet already shows the
    // new value as the sheet animates away.
    await sheet.current?.dismiss();
  };

  return (
    <View className={className}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label }}
        onPress={() => void sheet.current?.present()}
        className="flex-row items-center gap-3 py-3.5 active:opacity-70">
        <Text variant="rowTitle" numberOfLines={1} className="shrink">
          {label}
        </Text>

        <View className="min-w-0 flex-1 flex-row items-center justify-end gap-2">
          <Text
            numberOfLines={1}
            className={cn(
              'text-body shrink',
              selected === null && 'opacity-50',
              tone === 'action' && 'text-terracotta-700 font-body-semibold'
            )}>
            {selected === null ? placeholder : selected.label}
          </Text>
          {/* Chevron-forward, flipped: it means "opens", not "right". */}
          <Icon as={ChevronRight} flip className="size-4 shrink-0 opacity-40" />
        </View>
      </Pressable>

      {divider ? <View className="bg-border h-px" /> : null}

      <Sheet ref={sheet} title={label} scrollable contentClassName="pb-6">
        <ScrollView>
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: option.value === value }}
              onPress={() => void choose(option.value)}
              className="rounded-row active:bg-card flex-row items-center gap-3 px-3 py-3.5">
              <Text className="text-row flex-1">{option.label}</Text>
              {option.value === value ? (
                <Icon as={Check} className="text-olive-700 size-4.5" />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>
    </View>
  );
}

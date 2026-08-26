import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { Sheet } from '@workspace/ui-native/components/wassiya/sheet';
import type { SheetSelectOption } from '@workspace/ui-native/components/wassiya/sheet-select';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

/**
 * A one-of-N value inside a {@link FieldRow}.
 *
 * The value slot of a field row, for something chosen rather than typed. It
 * reads exactly like a typed value — 16px/600, no box, no chevron — because on
 * this screen the difference between "I can type here" and "I can pick here"
 * should cost nothing to discover: both are just the value, and tapping either
 * does the right thing.
 *
 * `SheetSelect` is the boxed-field version of this and stays where the wizards
 * put it; only the sheet is shared, so the two cannot drift into two different
 * ways of choosing one thing.
 *
 * An unset value shows its placeholder at 50%. That is a real state on ٤.٧,
 * which ships no default disposition on purpose — the board wants that choice
 * made, not guessed.
 */
export type ChoiceFieldProps = {
  /** The sheet's heading — usually the field's own label. */
  label: string;
  value: string | null;
  options: SheetSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function ChoiceField({
  label,
  value,
  options,
  onChange,
  placeholder = '—',
  className,
}: ChoiceFieldProps) {
  const sheet = useRef<TrueSheet>(null);
  const selected = options.find((option) => option.value === value) ?? null;

  const choose = async (next: string) => {
    onChange(next);
    await sheet.current?.dismiss();
  };

  return (
    <View className={className}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label }}
        onPress={() => void sheet.current?.present()}>
        <Text
          className={cn(
            'font-body-semibold text-foreground text-[16px]',
            selected === null && 'opacity-50'
          )}>
          {selected === null ? placeholder : selected.label}
        </Text>
      </Pressable>

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

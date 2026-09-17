import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { FieldLink } from '@workspace/ui-native/components/wassiya/field-link';
import { Sheet } from '@workspace/ui-native/components/wassiya/sheet';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check } from 'lucide-react-native';
import type * as React from 'react';
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

export type SheetSelectOption = {
  /** Stable identity — an ISO country code, an enum member. */
  value: string;
  label: string;
};

export type SheetSelectProps = {
  /** Field label, and the sheet's own heading. */
  label: string;
  value: string | null;
  options: SheetSelectOption[];
  onChange: (value: string) => void;
  /** One quiet line under the field. Not drawn when `trigger` replaces it. */
  hint?: string;
  /** Shown in the field when nothing is chosen yet. */
  placeholder?: string;
  /**
   * Replaces the built-in field, so something other than a bordered box can
   * open the same sheet — ٩.١'s language row hands back a `SettingsRow`.
   *
   * Given the opener and the current selection rather than a boolean, because
   * a trigger almost always wants to *show* what is chosen: the row renders
   * "العربية" in its value slot from exactly the option this sheet would tick.
   */
  trigger?: (
    open: () => void,
    selected: SheetSelectOption | null
  ) => React.ReactNode;
  /**
   * A quiet line **inside** the sheet, under the options.
   *
   * Where a caveat about the choice belongs once the field is gone: you read it
   * while choosing rather than after, and a row's one-line `detail` slot would
   * truncate a real sentence.
   */
  note?: string;
  className?: string;
};

/**
 * A single-choice field that opens a native bottom sheet.
 *
 * It exists next to `ui/select.tsx` because the upstream React Native Reusables
 * `Select` teleports through `PortalHost`, which breaks when the screen
 * underneath is replaced while the menu is open — `country-picker.tsx` hit that
 * during setup and hand-rolled a `Modal` to escape it. This replaces the
 * workaround, not the upstream component: `ui/select.tsx` stays verbatim from
 * the registry so it keeps diffing cleanly against future releases.
 *
 * **Sizing: `'auto'`, and `scrollable` only past six options.** A scroller
 * inside a TrueSheet stops it hugging its content and inflates it to most of the
 * screen, so a two-option list arrived as a full panel holding two rows and a
 * paragraph of air. Past six the scroller earns that cost, because `'auto'`
 * clamps to the container on a small handset and the last option would be
 * unreachable. Deliberately not a fractional detent either way — that is what
 * strands the options at the top of a half-height sheet.
 */
export function SheetSelect({
  label,
  value,
  options,
  onChange,
  hint,
  placeholder = '—',
  trigger,
  note,
  className,
}: SheetSelectProps) {
  const sheet = useRef<TrueSheet>(null);
  const selected = options.find((option) => option.value === value) ?? null;

  const choose = async (next: string) => {
    onChange(next);
    // Dismiss after committing, so the field behind the sheet already shows the
    // new value as the sheet animates away.
    await sheet.current?.dismiss();
  };

  const open = () => void sheet.current?.present();

  /** Past this, a scroller is worth what it costs in sheet height. */
  const scrollable = options.length > 6;

  if (trigger !== undefined) {
    return (
      <>
        {trigger(open, selected)}
        {renderSheet()}
      </>
    );
  }

  return (
    <View className={className}>
      {/* The box is `field-link`'s, so this and ٩.١b's email row cannot drift
          apart the next time a border or a height changes. */}
      <FieldLink
        label={label}
        value={selected?.label ?? ''}
        placeholder={placeholder}
        hint={hint}
        chevron="down"
        onPress={open}
      />
      {renderSheet()}
    </View>
  );

  function renderSheet() {
    return (
      <Sheet
        ref={sheet}
        title={label}
        scrollable={scrollable}
        contentClassName="pb-6">
        <Body>
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
          {note !== undefined ? (
            <Text variant="metaSm" className="text-muted-foreground mt-3 px-3 leading-[1.6]">
              {note}
            </Text>
          ) : null}
        </Body>
      </Sheet>
    );

    // A plain View lets the sheet hug; a ScrollView never does.
    function Body({ children }: { children: React.ReactNode }) {
      return scrollable ? <ScrollView>{children}</ScrollView> : <View>{children}</View>;
    }
  }
}

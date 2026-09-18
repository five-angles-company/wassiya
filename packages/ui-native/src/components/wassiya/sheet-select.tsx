import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { FieldLink } from '@workspace/ui-native/components/wassiya/field-link';
import { Sheet } from '@workspace/ui-native/components/wassiya/sheet';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check } from 'lucide-react-native';
import type * as React from 'react';
import { useRef } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

/**
 * Row and note heights as *this* component draws them — `py-3.5` twice plus a
 * line of `text-row`, and the note's three lines plus its margin.
 *
 * Estimated rather than measured on purpose: the list has to be sized before
 * the sheet opens, and an `onLayout` pass would show the reader a sheet that
 * resizes under them. It is safe to estimate because the rows are drawn right
 * here and are uniform by construction — if their padding changes, these change
 * with it.
 */
const ROW_HEIGHT = 50;
const NOTE_HEIGHT = 56;
/** Past this share of the screen a sheet stops reading as a sheet. */
const MAX_SHARE = 0.55;

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
 * ## Sizing: `'auto'`, and a scroller only when the list truly overflows
 *
 * A scroller inside a TrueSheet stops it hugging its content and inflates it to
 * most of the screen. That used to be gated on `options.length > 6`, which is a
 * guess about a height rather than a measurement of one — ten countries on a
 * tall handset fit comfortably, tripped the count anyway, and arrived as a
 * full-screen panel holding ten rows and a void.
 *
 * So the list's height is estimated, capped at `MAX_SHARE` of the window, and
 * the scroller appears **only if the estimate exceeds the cap**. Under it the
 * body is a plain `View` and the sheet hugs exactly; over it the scroller gets
 * the cap as a fixed height, so the sheet is exactly as tall as it is allowed to
 * be and the overflow scrolls.
 *
 * Deliberately not a fractional detent either way — that is what strands the
 * options at the top of a half-height sheet.
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

  const { height: windowHeight } = useWindowDimensions();
  const listHeight =
    options.length * ROW_HEIGHT + (note === undefined ? 0 : NOTE_HEIGHT);
  const capHeight = Math.round(windowHeight * MAX_SHARE);
  const scrollable = listHeight > capHeight;

  const choose = async (next: string) => {
    onChange(next);
    // Dismiss after committing, so the field behind the sheet already shows the
    // new value as the sheet animates away.
    await sheet.current?.dismiss();
  };

  const open = () => void sheet.current?.present();

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

    // A plain View lets the sheet hug; a ScrollView never does, so it is given
    // the cap as a fixed height rather than left to fill whatever it is offered.
    function Body({ children }: { children: React.ReactNode }) {
      return scrollable ? (
        <ScrollView style={{ height: capHeight }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View>{children}</View>
      );
    }
  }
}

import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { Sheet } from '@workspace/ui-native/components/wassiya/sheet';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, ChevronDown } from 'lucide-react-native';
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
  /** One quiet line under the field. */
  hint?: string;
  /** Shown in the field when nothing is chosen yet. */
  placeholder?: string;
  className?: string;
};

/**
 * A single-choice field that opens a native bottom sheet.
 *
 * ## Why this exists next to `ui/select.tsx`
 *
 * The upstream React Native Reusables `Select` teleports its content through
 * `PortalHost`, which breaks when the screen underneath is replaced while the
 * menu is open — `country-picker.tsx` hit exactly that during the setup flow and
 * hand-rolled a `Modal` to escape it. That workaround then had to redraw the
 * whole sheet in JS: a black scrim, a rounded top, a fake grabber pill, a
 * `max-h-[70%]` guess, and no drag-to-dismiss.
 *
 * This replaces the workaround, not the upstream component. `ui/select.tsx`
 * stays verbatim from the registry so it keeps diffing cleanly against future
 * releases; anything in this app that wants the board's sheet grammar uses this
 * instead.
 *
 * ## Sizing
 *
 * `'auto'` plus `scrollable`. Option lists here are short — a dozen countries,
 * six asset types — so the sheet hugs its content on a normal handset and reads
 * as a menu rather than a panel. The scroller exists for the small-screen case
 * where `'auto'` clamps to the container and the last option would otherwise be
 * unreachable. It is deliberately not a fractional detent: that is what
 * produces a half-height sheet with the options stranded at the top.
 */
export function SheetSelect({
  label,
  value,
  options,
  onChange,
  hint,
  placeholder = '—',
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

  return (
    <View className={cn('gap-2', className)}>
      <Text variant="meta" className="text-muted-foreground">
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label }}
        onPress={() => void sheet.current?.present()}
        className="rounded-box border-border bg-card h-12.5 flex-row items-center justify-between border px-4 active:bg-sand-300">
        <Text className="text-body">{selected === null ? placeholder : selected.label}</Text>
        {/* Chevron-down is vertical, so it needs no RTL mirroring. */}
        <Icon as={ChevronDown} className="text-muted-foreground size-4" />
      </Pressable>

      {hint !== undefined ? (
        <Text variant="metaSm" className="text-muted-foreground">
          {hint}
        </Text>
      ) : null}

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

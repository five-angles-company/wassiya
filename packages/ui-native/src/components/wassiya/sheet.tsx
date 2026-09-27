import { TrueSheet, type SheetDetent } from '@lodev09/react-native-true-sheet';
import { Text } from '@workspace/ui-native/components/ui/text';
import { NATIVE_COLOR } from '@workspace/ui-native/lib/native-colors';
import { cn } from '@workspace/ui-native/lib/utils';
import type * as React from 'react';
import { View } from 'react-native';

/**
 * Mirrors `--radius-sheet` in the app's `global.css`. A literal because the
 * sheet's surface and corners are drawn natively (UIKit / Android's
 * BottomSheet) before any React view exists, so there is nothing for Uniwind to
 * style. Everything *inside* the sheet uses `className` as usual.
 */
const SHEET_CORNER_RADIUS = 34;

export type SheetProps = {
  ref?: React.Ref<TrueSheet>;
  /** Heading inside the sheet. Omit for a sheet whose content titles itself. */
  title?: string;
  /** One line under the title. */
  description?: string;
  /**
   * Heights the sheet supports, smallest first. Defaults to a single `'auto'`
   * detent — see the sizing note below before adding more.
   */
  detents?: SheetDetent[];
  /** Caps an `'auto'` detent, in points. */
  maxContentHeight?: number;
  /**
   * Set when `children` contain a `ScrollView`/`FlatList`, so the native side
   * arbitrates between scrolling the content and dragging the sheet.
   *
   * Pair it with `'auto'`, not a fraction. A scroller inside a *fractional*
   * detent is the combination that sizes the sheet to the fraction and strands
   * the content at the top; with `'auto'` the sheet still hugs its content and
   * the scroller only engages once the content is tall enough to be clamped.
   */
  scrollable?: boolean;
  children: React.ReactNode;
  /**
   * Fired once the sheet is fully open — TrueSheet's `onDidPresent`. Content
   * that owns a hardware resource (a camera preview) should start on this
   * rather than on mount, so it is live only while the sheet is.
   */
  onPresent?: () => void;
  /**
   * Fired once the sheet has finished animating away — TrueSheet's
   * `onDidDismiss`. The `onWillDismiss` half is deliberately not surfaced: a
   * caller that resets state on *will* runs it while the sheet is still
   * visible, so the content visibly blanks on the way out.
   */
  onDismiss?: () => void;
  contentClassName?: string;
};

/**
 * The app's bottom sheet — a real native one.
 *
 * Native rather than a `Modal` or a portal, and both alternatives are in this
 * repo with costs these sheets cannot pay. `Select` teleports through
 * `PortalHost`, which breaks when the screen underneath is replaced
 * mid-interaction (see `country-picker.tsx`). A `Modal` is a full-screen
 * overlay: it cannot be dragged, cannot rest at a detent, and dismisses with a
 * back press that unwinds whatever is behind it — where the design asks for a
 * sheet that "dismisses without losing the list scroll".
 *
 * **Sizing: prefer `'auto'`, and never wrap short content in a scroller.** The
 * default is a single `'auto'` detent that hugs the content. Handing the library
 * a `ScrollView` and a fractional detent reliably produces a sheet sized to the
 * fraction with the content stranded at the top. Reach for a fractional or
 * `'peek'` detent only when the content genuinely scrolls, and bound a long
 * `'auto'` sheet with `maxContentHeight` instead.
 *
 * The sheet chrome is drawn natively and mirrors with the OS, so RTL needs no
 * handling here.
 *
 * @example
 * const sheet = useRef<TrueSheet>(null)
 * <Sheet ref={sheet} title="ما الذي تريد حفظه؟">…</Sheet>
 * await sheet.current?.present()
 */
export function Sheet({
  ref,
  title,
  description,
  detents = ['auto'],
  maxContentHeight,
  scrollable = false,
  children,
  onPresent,
  onDismiss,
  contentClassName,
}: SheetProps) {
  return (
    <TrueSheet
      ref={ref}
      detents={detents}
      maxContentHeight={maxContentHeight}
      scrollable={scrollable}
      backgroundColor={NATIVE_COLOR.background}
      cornerRadius={SHEET_CORNER_RADIUS}
      onDidPresent={onPresent ? () => onPresent() : undefined}
      onDidDismiss={onDismiss ? () => onDismiss() : undefined}
      grabber
      dimmed>
      <View className={cn('px-gutter pb-8 pt-5', contentClassName)}>
        {title || description ? (
          <View className="mb-header gap-1.5">
            {title ? <Text variant="dialogTitle">{title}</Text> : null}
            {description ? (
              <Text variant="p" className="text-muted-foreground">
                {description}
              </Text>
            ) : null}
          </View>
        ) : null}
        {children}
      </View>
    </TrueSheet>
  );
}

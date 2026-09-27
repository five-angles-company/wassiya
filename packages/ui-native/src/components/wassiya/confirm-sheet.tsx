import type { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Text } from '@workspace/ui-native/components/ui/text';
import { PrimaryCta } from '@workspace/ui-native/components/wassiya/primary-cta';
import { Sheet } from '@workspace/ui-native/components/wassiya/sheet';
import type * as React from 'react';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

/**
 * Every confirmation in the app — deleting, signing out, revoking a device,
 * leaving a filled form — as a bottom sheet in the app's own look. Never
 * `Alert.alert`.
 *
 * Consequence before confirmation: `body` says what is lost. With `danger` the
 * confirm is outlined and keeping things is the filled, calm choice.
 */
export type ConfirmSheetProps = {
  open: boolean;
  /** Fired once the sheet is gone, however it closed. */
  onClose: () => void;
  title: string;
  /** Paragraphs, in order. */
  body?: string[];
  confirmLabel: string;
  /** Replaces `confirmLabel` while `busy`. */
  busyLabel?: string;
  cancelLabel: string;
  tone?: 'danger' | 'primary';
  /**
   * Receives `dismiss`, to await before navigating away: leaving the screen
   * with the sheet still up strands it over whatever comes next.
   */
  onConfirm: (dismiss: () => Promise<void>) => void;
  busy?: boolean;
  /** One line of terracotta text above the buttons. */
  error?: string | null;
  /** Anything the body needs beyond paragraphs, above the error line. */
  children?: React.ReactNode;
};

export function ConfirmSheet({
  open,
  onClose,
  title,
  body = [],
  confirmLabel,
  busyLabel,
  cancelLabel,
  tone = 'danger',
  onConfirm,
  busy = false,
  error = null,
  children,
}: ConfirmSheetProps) {
  const sheet = useRef<TrueSheet>(null);

  // Only dismiss what was presented: a dismiss on every mount makes TrueSheet
  // warn once per screen opened.
  const presented = useRef(false);
  useEffect(() => {
    if (open) {
      presented.current = true;
      void sheet.current?.present();
      return;
    }
    if (presented.current) void sheet.current?.dismiss();
  }, [open]);

  return (
    <Sheet ref={sheet} title={title} onDismiss={onClose}>
      {body.length > 0 || children !== undefined ? (
        <View className="mb-6 gap-3">
          {body.map((paragraph) => (
            <Text key={paragraph} variant="prose">
              {paragraph}
            </Text>
          ))}
          {children}
        </View>
      ) : null}
      {error !== null ? (
        <Text variant="meta" className="text-terracotta-800 mb-3">
          {error}
        </Text>
      ) : null}
      <View className="gap-2.5">
        <PrimaryCta
          tone={tone}
          label={busy && busyLabel !== undefined ? busyLabel : confirmLabel}
          onPress={() =>
            onConfirm(async () => {
              await sheet.current?.dismiss();
            })
          }
          busy={busy}
        />
        <PrimaryCta tone="quiet" label={cancelLabel} onPress={onClose} disabled={busy} />
      </View>
    </Sheet>
  );
}

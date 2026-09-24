import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { Paperclip, SendHorizontal, X } from 'lucide-react-native';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';

/**
 * The reply box under a support conversation.
 *
 * `note` is always shown — the standing line that chat is not encrypted like
 * the vault and that nobody will ask for the recovery sheet. `warning` replaces
 * nothing; it appears above the note when the caller has spotted something that
 * must not be sent, and the send button is disabled by the caller in that case.
 *
 * The send target is 56px, the size of a primary CTA. A disabled send is
 * surface-toned, never a faded terracotta.
 */
export type ChatComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  note: string;
  sendLabel: string;
  attachLabel?: string;
  onAttach?: () => void;
  files?: { name: string }[];
  onRemoveFile?: (index: number) => void;
  warning?: string | null;
  error?: string | null;
  disabled?: boolean;
  busy?: boolean;
};

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  placeholder,
  note,
  sendLabel,
  attachLabel,
  onAttach,
  files = [],
  onRemoveFile,
  warning,
  error,
  disabled = false,
  busy = false,
}: ChatComposerProps) {
  const blocked = disabled || busy;
  return (
    <View className="gap-2.5">
      {files.length > 0 ? (
        <View className="flex-row flex-wrap gap-[7px]">
          {files.map((file, index) => (
            <View
              key={index}
              className="bg-card flex-row items-center gap-1.5 rounded-full px-3 py-1.5">
              <Text className="text-[12.5px]" numberOfLines={1}>
                {file.name}
              </Text>
              {onRemoveFile ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={file.name}
                  hitSlop={8}
                  onPress={() => onRemoveFile(index)}>
                  <Icon as={X} className="text-muted-foreground size-3.5" />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-end gap-2">
        {onAttach ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={attachLabel}
            onPress={onAttach}
            disabled={busy}
            className="bg-card h-14 w-14 items-center justify-center rounded-full active:opacity-70">
            <Icon as={Paperclip} className="text-foreground size-5" />
          </Pressable>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline
          textAlignVertical="top"
          className="bg-card text-foreground placeholder:text-muted-foreground/60 min-h-14 max-h-40 flex-1 rounded-[18px] px-4 py-3.5 text-[15px] leading-[1.5]"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sendLabel}
          accessibilityState={{ disabled: blocked }}
          onPress={onSend}
          disabled={blocked}
          className={cn(
            'h-14 w-14 items-center justify-center rounded-full',
            blocked ? 'bg-card' : 'bg-primary active:opacity-80'
          )}>
          {busy ? (
            <ActivityIndicator />
          ) : (
            <Icon
              as={SendHorizontal}
              flip
              className={cn('size-5', blocked ? 'text-muted-foreground' : 'text-background')}
            />
          )}
        </Pressable>
      </View>

      {warning ? (
        <Text className="text-terracotta-700 font-body-semibold text-[13px] leading-[1.6]">
          {warning}
        </Text>
      ) : null}
      {error ? (
        <Text className="text-terracotta-700 text-[13px] leading-[1.6]">{error}</Text>
      ) : null}
      <Text variant="footnote">{note}</Text>
    </View>
  );
}

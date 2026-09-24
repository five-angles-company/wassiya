import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { Paperclip } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * One message in a support conversation.
 *
 * The reader's own message is the screen's one accent: solid terracotta with
 * `--color-bg` text, like a primary button. The other side sits on
 * `--color-surface`. `meta` is a single quiet line under the bubble — who and
 * when — never a badge.
 */
export type ChatBubbleProps = {
  own: boolean;
  body: string;
  meta: string;
  attachments?: { name: string; onPress?: () => void }[];
};

export function ChatBubble({ own, body, meta, attachments = [] }: ChatBubbleProps) {
  return (
    <View className={cn('max-w-[85%] gap-1', own ? 'self-end items-end' : 'self-start items-start')}>
      <View className={cn('gap-2 rounded-[18px] px-4 py-3', own ? 'bg-primary' : 'bg-card')}>
        {body.length > 0 ? (
          <Text
            selectable
            className={cn('text-[15px] leading-[1.6]', own ? 'text-background' : 'text-foreground')}>
            {body}
          </Text>
        ) : null}
        {attachments.map((file, index) => (
          <Pressable
            key={index}
            accessibilityRole="link"
            onPress={file.onPress}
            disabled={file.onPress === undefined}
            className="flex-row items-center gap-1.5 active:opacity-70">
            <Icon
              as={Paperclip}
              className={cn('size-3.5', own ? 'text-background' : 'text-foreground')}
            />
            <Text
              className={cn(
                'text-[13px] underline',
                own ? 'text-background' : 'text-foreground'
              )}>
              {file.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text variant="metaSm">{meta}</Text>
    </View>
  );
}

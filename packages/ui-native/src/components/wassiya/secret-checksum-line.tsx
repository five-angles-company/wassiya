import { Icon } from '@workspace/ui-native/components/ui/icon';
import { Text } from '@workspace/ui-native/components/ui/text';
import { cn } from '@workspace/ui-native/lib/utils';
import { Check, TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';

export type SecretChecksum = 'valid' | 'invalid' | 'unknown';

export type SecretChecksumLineProps = {
  checksum: SecretChecksum;
  /** Message for the valid case, already localised and counted. */
  validMessage: string;
  /** Message for the invalid case. */
  invalidMessage: string;
  className?: string;
};

/**
 * The verdict line under a guarded secret.
 *
 * This is the highest-stakes label in the product. A BIP-39 phrase whose
 * checksum does not match is not a typo to fix later — it is a silently dead
 * asset, discovered by an heir years afterwards when nothing can be done. So
 * the check runs on device before anything is stored, and its result is stated
 * plainly rather than left to a validation border.
 */
export function SecretChecksumLine({
  checksum,
  validMessage,
  invalidMessage,
  className,
}: SecretChecksumLineProps) {
  if (checksum === 'unknown') return null;
  const valid = checksum === 'valid';
  return (
    <View
      className={cn(
        'flex-row items-center gap-2.5 rounded-box p-3',
        valid ? 'bg-olive-100' : 'bg-terracotta-200',
        className
      )}>
      <Icon
        as={valid ? Check : TriangleAlert}
        className={cn('size-4', valid ? 'text-olive-900' : 'text-terracotta-900')}
      />
      <Text className={cn('flex-1 text-meta', valid ? 'text-olive-900' : 'text-terracotta-900')}>
        {valid ? validMessage : invalidMessage}
      </Text>
    </View>
  );
}

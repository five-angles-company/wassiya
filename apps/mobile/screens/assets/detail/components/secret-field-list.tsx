import { Text } from "@workspace/ui-native/components/ui/text"
import { monoFont } from "@workspace/ui-native/lib/fonts"
import { isolateLtr } from "@workspace/ui-native/lib/rtl"
import { cn } from "@workspace/ui-native/lib/utils"
import { View } from "react-native"

import type { SecretField } from "@/screens/assets/detail/secret-fields"

/**
 * A revealed secret, as rows of label and value.
 *
 * Replaces printing the stored payload, which for every type but a seed phrase
 * meant showing the owner raw JSON — braces, quotes and key names — on the one
 * screen they had just proven their identity to reach.
 *
 * ## Latin values are isolated and fixed-width
 *
 * An IBAN, a password, a 2FA secret and a wallet address are all transcribed
 * character by character by someone who may be reading them aloud down a phone
 * line. Arabic-Indic digit shaping or a bidi reorder in the middle of one is
 * how a family locks itself out of an account, so those values render in the
 * mono face inside an LTR isolate.
 *
 * ## Rules run between rows, not around them
 *
 * The block already sits inside a tinted guarded card. Boxing each field again
 * would nest three surfaces to show four lines of text; a hairline is enough
 * to say where one value ends and the next begins.
 */
export type SecretFieldListProps = {
  fields: SecretField[]
  className?: string
}

export function SecretFieldList({ fields, className }: SecretFieldListProps) {
  return (
    <View className={cn("rounded-box bg-background px-3.5 py-1", className)}>
      {fields.map((field, i) => (
        <View
          key={field.label}
          className={cn(
            "gap-1 py-3",
            i > 0 && "border-border border-t"
          )}
        >
          <Text variant="metaSm">{field.label}</Text>
          {field.mono ? (
            <Text className={cn(monoFont, "text-[13.5px] leading-[1.7]")}>
              {isolateLtr(field.value)}
            </Text>
          ) : (
            <Text className="text-prose-sm text-foreground">{field.value}</Text>
          )}
        </View>
      ))}
    </View>
  )
}

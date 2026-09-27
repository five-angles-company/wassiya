import { useState } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { NATIVE_COLOR } from "@workspace/ui-native/lib/native-colors"
import { monoFont } from "@workspace/ui-native/lib/fonts"
import { cn } from "@workspace/ui-native/lib/utils"
import { Eye, EyeOff } from "lucide-react-native"
import { Pressable, TextInput, View } from "react-native"

import {
  MASKED_SECRET_INPUT_PROPS,
  SECRET_INPUT_PROPS,
} from "@/lib/secret-input-props"

export type SecretFieldProps = {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  hint?: string
  /** Multi-line once revealed — recovery codes, one per line. */
  multiline?: boolean
  /** Called each time the value is shown, so the reveal is audited. */
  onReveal?: () => void
  revealLabel: string
}

/**
 * `Field`'s box for a password: masked, with an eye to show it.
 *
 * ⚠️ Masked and shown use different input props. `visible-password` and
 * `secureTextEntry` together render the value in the clear on Android — see
 * `lib/secret-input-props.ts`. A multi-line input cannot be masked at all, so
 * the field is single-line until it is revealed.
 */
export function SecretField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  multiline = false,
  onReveal,
  revealLabel,
}: SecretFieldProps) {
  const [shown, setShown] = useState(false)
  const expanded = multiline && shown

  return (
    <View className="gap-2">
      <Text variant="meta" className="text-muted-foreground">
        {label}
      </Text>
      <View
        className={cn(
          "rounded-box border-border bg-card flex-row gap-2 border px-4",
          expanded ? "items-start py-3" : "h-12.5 items-center"
        )}
      >
        <TextInput
          {...(shown ? SECRET_INPUT_PROPS : MASKED_SECRET_INPUT_PROPS)}
          secureTextEntry={!shown}
          multiline={expanded}
          textAlignVertical={expanded ? "top" : "center"}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={NATIVE_COLOR.mutedForeground}
          className={cn(
            "text-foreground flex-1 p-0 text-[16px]",
            expanded && cn(monoFont, "min-h-20 text-[14px] leading-[1.8]")
          )}
          style={{ writingDirection: "ltr" }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={revealLabel}
          onPress={() => {
            if (!shown) onReveal?.()
            setShown((was) => !was)
          }}
          hitSlop={10}
          className={cn("shrink-0", expanded && "pt-0.5")}
        >
          <Icon
            as={shown ? EyeOff : Eye}
            size={19}
            strokeWidth={2.5}
            className="text-foreground opacity-50"
          />
        </Pressable>
      </View>
      {hint !== undefined ? (
        <Text variant="metaSm" className="text-muted-foreground">
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

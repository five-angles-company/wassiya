import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { TextInput, View, type TextInputProps } from "react-native"

/**
 * `--color-muted-foreground` (#82796a). React Native takes the placeholder
 * colour as a *prop*; `placeholder:` variants are web-only and are skipped by
 * the class checker, so this token has to exist here as a literal. Keep in step
 * with apps/mobile/global.css.
 */
const MUTED_FOREGROUND = "#82796a"

export type FieldProps = TextInputProps & {
  label: string
  /** Quiet line under the field — a hint, or an error when `error` is set. */
  hint?: string
  /** Error text. Replaces `hint` and tints the field. */
  error?: string
  containerClassName?: string
}

/**
 * A labelled text field at the product's proportions.
 *
 * The shared `Input` primitive is upstream shadcn verbatim — 40px tall, 12px
 * radius, and carrying an inert `dark:bg-input/30` — which is not the 50px
 * boxed field the screen grammar specifies ("50px field", "20 boxed field"
 * radius). Rather than restyle `Input` per screen, forms compose this.
 *
 * Errors tint the border a deep terracotta rather than red: the palette has no
 * red, and an outlined field is enough signal next to the message.
 */
export function Field({
  label,
  hint,
  error,
  containerClassName,
  className,
  ...props
}: FieldProps) {
  const message = error ?? hint
  return (
    <View className={cn("gap-2", containerClassName)}>
      <Text variant="meta" className="text-muted-foreground">
        {label}
      </Text>
      <TextInput
        className={cn(
          "rounded-box h-12.5 w-full bg-card px-4 text-[16px] text-foreground",
          "border",
          error === undefined ? "border-border" : "border-terracotta-700",
          props.editable === false && "opacity-50",
          className
        )}
        placeholderTextColor={MUTED_FOREGROUND}
        {...props}
      />
      {message !== undefined ? (
        <Text
          variant="metaSm"
          className={
            error === undefined
              ? "text-muted-foreground"
              : "text-terracotta-800"
          }
        >
          {message}
        </Text>
      ) : null}
    </View>
  )
}

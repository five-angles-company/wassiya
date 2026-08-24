import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import type { LucideIcon } from "lucide-react-native"
import type * as React from "react"
import { View } from "react-native"

export type WelcomeSlideProps = {
  icon: LucideIcon
  /** Sage for the safety voice, terracotta for the trust claim. */
  tone: "olive" | "terracotta"
  title: string
  body: string
  /** The four release gates on slide ٣. */
  children?: React.ReactNode
  width: number
}

const TONE_BG = {
  olive: "bg-olive-100",
  terracotta: "bg-terracotta-200",
} as const

const TONE_FG = {
  olive: "text-olive-700",
  terracotta: "text-terracotta-800",
} as const

/**
 * One carousel panel: a soft circular illustration slot, a heading and a body.
 *
 * The blob is an illustration *slot* — the board calls for commissioned art at
 * 250×250 here, and the Lucide glyph is a stand-in that keeps the composition
 * honest until that lands.
 *
 * `width` is passed rather than measured because the parent is a paged
 * `ScrollView`: each page has to be exactly the viewport wide or the paging
 * stops aligning, and a percentage cannot express that inside a horizontal
 * scroll container.
 */
export function WelcomeSlide({
  icon,
  tone,
  title,
  body,
  children,
  width,
}: WelcomeSlideProps) {
  return (
    <View style={{ width }} className="px-gutter">
      <View
        className={cn(
          "mx-auto mt-5.5 mb-7.5 size-62.5 items-center justify-center rounded-full",
          TONE_BG[tone]
        )}
      >
        <Icon as={icon} className={cn("size-21.5", TONE_FG[tone])} />
      </View>

      <Text variant="screenTitle" className="mb-3 text-[29px] leading-tight">
        {title}
      </Text>
      <Text className="text-[15.5px] leading-[1.7] text-muted-foreground">
        {body}
      </Text>

      {children !== undefined ? (
        <View className="mt-3.5 gap-2">{children}</View>
      ) : null}
    </View>
  )
}

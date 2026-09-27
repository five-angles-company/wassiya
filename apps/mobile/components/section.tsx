import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import type * as React from "react"
import { View } from "react-native"

/**
 * A labelled group on a screen: a section label, then its content — usually
 * one card of rows. Screens stack sections `gap-6` apart, so every screen's
 * rhythm is the same.
 */
export function Section({
  label,
  tone = "default",
  children,
  className,
}: {
  label?: string
  /** `done` for a label that reports all-clear. */
  tone?: "default" | "done"
  children: React.ReactNode
  className?: string
}) {
  return (
    <View className={cn("gap-2", className)}>
      {label !== undefined ? (
        <Text variant="sectionLabel" className={tone === "done" ? "text-olive-700" : undefined}>
          {label}
        </Text>
      ) : null}
      {children}
    </View>
  )
}

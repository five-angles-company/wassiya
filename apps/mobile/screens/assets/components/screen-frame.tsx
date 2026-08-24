import { Text } from "@workspace/ui-native/components/ui/text"
import type * as React from "react"
import { View } from "react-native"

export type ScreenFrameProps = {
  title: string
  children: React.ReactNode
}

/**
 * The screen title over a body that fills the rest.
 *
 * Used by the two 4.1 states that have nothing to search — locked and empty —
 * so الأصول keeps its heading in the same place at the same size whichever one
 * is showing. Without it each state would re-declare the header and they would
 * drift by a pixel or two the first time one of them was touched.
 */
export function ScreenFrame({ title, children }: ScreenFrameProps) {
  return (
    <View className="flex-1 bg-background pt-6">
      <Text variant="screenTitle" className="px-gutter mb-header">
        {title}
      </Text>
      {children}
    </View>
  )
}

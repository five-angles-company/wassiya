import { ScrollView, View } from "react-native"
import { Text } from "@workspace/ui-native/components/ui/text"
import { StatusPill } from "@workspace/ui-native/components/wassiya/status-pill"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import { isRTL } from "@workspace/ui-native/lib/rtl"

import { AuthDemo } from "@/components/auth-demo"
import { DEFAULT_LOCALE } from "@/lib/direction"

export default function Index() {
  const today = new Date()

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 px-gutter py-6"
      className="bg-background flex-1"
    >
      {/* Renders in Cairo/IBM Plex Sans Arabic, mirrored, with Arabic-Indic
          numerals — a live check that the type stack, the RTL latch and the
          formatting layer are all actually wired up. */}
      <View className="gap-1">
        <Text variant="screenTitle">وصيّة</Text>
        <Text variant="meta" className="text-muted-foreground">
          {`${fmtDate(today, DEFAULT_LOCALE)} · ${fmtNum(5, DEFAULT_LOCALE)} حمايات`}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <StatusPill status="confirmed">مفعّل</StatusPill>
        <StatusPill status="action">مطلوب</StatusPill>
        <StatusPill status="waiting">قيد المراجعة</StatusPill>
      </View>

      <View className="bg-card gap-1 rounded-card p-4">
        <Text variant="sectionLabel">Auth test</Text>
        <Text variant="metaSm">{`RTL layout: ${isRTL() ? "on" : "off"}`}</Text>
      </View>

      <AuthDemo />
    </ScrollView>
  )
}

import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { router } from "expo-router"
import { Check, Info, KeyRound } from "lucide-react-native"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"

/**
 * 2.3b — the key exists.
 *
 * The amber row is not a decorative counterpoint to the sage one. At this exact
 * point MK is sealed on the device but its recovery wrapper has never been
 * saved, which is the one state in the whole flow that is genuinely unsafe to
 * abandon: lose or wipe this handset now and there is no second key anywhere.
 *
 * That is why this screen has no back and no skip. The CTA is the only forward
 * path, and the resume table routes straight back here — or on to the kit — if
 * the user leaves anyway.
 */
export function BiometricsDoneScreen() {
  const { t, locale } = useStrings("setup/biometrics/done")
  const { t: common } = useStrings("common")

  return (
    <Screen inset="flow">
      <SetupStepMeter
        step={SETUP_STEP_INDEX.biometrics}
        complete
        locale={locale}
        separator={common.stepSeparator}
        className="mb-12"
      />

      <View className="mb-8 size-52.5 items-center justify-center self-center rounded-full bg-olive-100">
        <View className="size-38 items-center justify-center rounded-full bg-olive-200">
          <View className="size-24 items-center justify-center rounded-full bg-secondary">
            <Icon as={KeyRound} className="size-11 text-background" />
          </View>
        </View>
      </View>

      <Text variant="screenTitle" className="mb-3 text-center text-[31px]">
        {t.title}
      </Text>
      <Text className="text-body mb-6.5 text-center leading-[1.7] text-muted-foreground">
        {t.body}
      </Text>

      <View className="gap-row">
        <View className="rounded-row flex-row items-center gap-2.75 bg-olive-100 px-4 py-3.5">
          <Icon as={Check} className="size-4.5 shrink-0 text-olive-800" />
          <Text className="text-section flex-1 text-olive-800">{t.sealed}</Text>
        </View>
        <View className="bg-terracotta-100 rounded-row flex-row items-center gap-2.75 px-4 py-3.5">
          <Icon as={Info} className="text-terracotta-800 size-4.5 shrink-0" />
          <Text className="text-section text-terracotta-800 flex-1">
            {t.remaining}
          </Text>
        </View>
      </View>

      <View className="grow" />

      <Button
        className="mt-6"
        onPress={() => router.replace("/setup/recovery-kit")}
      >
        <Text>{t.cta}</Text>
      </Button>
    </Screen>
  )
}

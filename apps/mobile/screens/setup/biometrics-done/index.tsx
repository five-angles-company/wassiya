import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Surface } from "@workspace/ui-native/components/wassiya/surface"
import { router } from "expo-router"
import { Check, Info } from "lucide-react-native"

import { View } from "react-native"

import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
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
    <Screen
      inset="flow"
      footer={<PrimaryCta label={t.cta!} onPress={() => router.replace("/setup/recovery-kit")} />}
    >
      <SetupStepMeter
        step={SETUP_STEP_INDEX.biometrics}
        complete
        locale={locale}
        separator={common.stepSeparator}
        className="mb-6"
      />

      <ScreenHeader title={t.title!} description={t.body} />

      <View className="gap-row">
        <Surface tone="olive" as="row" row className="gap-3">
          <Icon as={Check} className="size-4.5 shrink-0 text-olive-800" />
          <Text className="text-section flex-1 text-olive-800">{t.sealed}</Text>
        </Surface>
        <Surface tone="terracotta" as="row" row className="gap-3">
          <Icon as={Info} className="text-terracotta-800 size-4.5 shrink-0" />
          <Text className="text-section text-terracotta-800 flex-1">{t.remaining}</Text>
        </Surface>
      </View>
    </Screen>
  )
}

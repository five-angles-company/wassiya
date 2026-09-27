import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { KeyCard } from "@workspace/ui-native/components/wassiya/key-card"
import { router } from "expo-router"
import { Fingerprint, Printer, Users } from "lucide-react-native"

import { View } from "react-native"

import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"

/**
 * 2.2 — the key model, taught once.
 *
 * A pure comprehension screen with no side effects, and the **only** place the
 * recovery model is explained. Each card pre-names a later step: the device leg
 * is 2.3, the printed sheet is 2.4, and executors arrive in section ٥.
 *
 * Two keys and a card that is not a key. The device opens the vault daily and
 * the **sheet opens it alone** when the device is gone; executors never open
 * it — their sheet opens only what was handed over, after a verified death.
 */
export function ExplainerScreen() {
  const { t, locale } = useStrings("setup/explainer")
  const { t: common } = useStrings("common")

  return (
    <Screen
      inset="flow"
      footer={<PrimaryCta label={t.cta!} onPress={() => router.replace("/setup/biometrics")} />}
    >
      <SetupStepMeter
        step={SETUP_STEP_INDEX.explainer}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-6"
      />

      <ScreenHeader title={t.title!} description={t.body} />

      <View className="gap-row">
        <KeyCard
          icon={Fingerprint}
          title={t.deviceTitle}
          description={t.deviceBody}
        />
        <KeyCard
          icon={Printer}
          title={t.paperTitle}
          description={t.paperBody}
        />
        {/* Pending: dimmed because it is not a key, and the screen stays honest
            about which keys are actually live. */}
        <KeyCard
          icon={Users}
          title={t.executorsTitle}
          description={t.executorsBody}
          pending
        />
      </View>
    </Screen>
  )
}

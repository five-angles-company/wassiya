import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { KeyCard } from "@workspace/ui-native/components/wassiya/key-card"
import { router } from "expo-router"
import { Fingerprint, Printer, Shield } from "lucide-react-native"

import { View } from "react-native"

import { Screen } from "@/components/screen"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"

/**
 * 2.2 — the key model, taught once.
 *
 * A pure comprehension screen with no side effects, and the **only** place the
 * recovery model is explained. Each card pre-names a later step: the device leg
 * is 2.3, the printed sheet is 2.4, and the guardian arrives in section ٦.
 *
 * ## Two keys, and a third card that is not a key
 *
 * This taught a 2-of-3 where any two of three keys opened the vault. It is not
 * that any more: the device opens the vault daily, the **sheet opens it alone**
 * when the device is gone, and the guardian cannot open it at all — they hold
 * half of what each *heir* receives.
 *
 * The guardian card stays, because an owner who is never told why they are
 * appointing one will not appoint one, and then their heirs receive a box that
 * does not open. But it is framed as a later, different thing rather than a
 * third key, and the copy must not drift back: describing the guardian as a way
 * into this vault would describe a weaker system than the crypto implements.
 */
export function ExplainerScreen() {
  const { t, locale } = useStrings("setup/explainer")
  const { t: common } = useStrings("common")

  return (
    <Screen inset="flow">
      <SetupStepMeter
        step={SETUP_STEP_INDEX.explainer}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-header"
      />

      <Text variant="screenTitle" className="mb-2.5 text-[28px]">
        {t.title}
      </Text>
      <Text className="mb-5 text-[14.5px] leading-[1.7] text-muted-foreground">
        {t.body}
      </Text>

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
        {/* Pending: no guardian exists until section ٦, and dimming the card is
            how the screen stays honest about which keys are actually live. */}
        <KeyCard
          icon={Shield}
          title={t.guardianTitle}
          description={t.guardianBody}
          pending
        />
      </View>

      <View className="grow" />

      <Button
        className="mt-5"
        onPress={() => router.replace("/setup/biometrics")}
      >
        <Text>{t.cta}</Text>
      </Button>
    </Screen>
  )
}

import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { KeyCard } from "@workspace/ui-native/components/wassiya/key-card"
import { router } from "expo-router"
import { Fingerprint, KeyRound, Printer, Shield } from "lucide-react-native"
import { ScrollView, View } from "react-native"

import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"

/**
 * 2.2 — the 2-of-3 model, taught once.
 *
 * A pure comprehension screen with no side effects, and the **only** place the
 * recovery model is explained. The three cards are the three keys, and each one
 * pre-names a later step: the device leg is 2.3, the printed sheet is 2.4, and
 * the guardian arrives in section ٦.
 *
 * Copy rule the product cannot break anywhere: never "your key", always two of
 * three. A single-key story would describe a different, weaker system than the
 * one the crypto actually implements.
 */
export function ExplainerScreen() {
  const { t, locale } = useStrings("setup/explainer")
  const { t: common } = useStrings("common")

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow px-gutter pb-5 pt-3.5"
    >
      <SetupStepMeter
        step={SETUP_STEP_INDEX.explainer}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-header"
      />

      <View className="mb-6.5 size-52.5 items-center justify-center self-center rounded-full bg-olive-100">
        <Icon as={KeyRound} className="size-20 text-olive-700" />
      </View>

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
    </ScrollView>
  )
}

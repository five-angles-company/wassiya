import { useClerk } from "@clerk/expo"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { router } from "expo-router"
import { KeyRound } from "lucide-react-native"
import { ScrollView, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"

/**
 * 8.1 — recovery on a device with no key. **A deliberate stub.**
 *
 * Two states land here and neither can be resolved by retrying setup: a phone
 * the user has never enrolled, and one whose keystore invalidated MK because
 * its biometrics changed. Both need the recovery ceremony — paper share plus
 * guardian approval — which belongs to a later session along with section ٦'s
 * guardian enrolment.
 *
 * Until then this screen is honest about the dead end rather than looping the
 * user back into a setup flow that would refuse them at `keyring.save`. Sign
 * out is offered because it is the one action that reliably gets a wrongly
 * routed user somewhere useful.
 */
export function RecoveryStubScreen() {
  const { t } = useStrings("recovery")
  const { signOut } = useClerk()

  async function leave() {
    await signOut()
    router.replace("/")
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow px-gutter pb-6 pt-8"
    >
      <View className="bg-terracotta-200 mb-6 size-26 items-center justify-center rounded-full">
        <Icon as={KeyRound} className="text-terracotta-800 size-11" />
      </View>

      <Text variant="screenTitle" className="mb-3 text-[28px]">
        {t.title}
      </Text>
      <Text className="mb-5 text-[14.5px] leading-[1.7] text-muted-foreground">
        {t.body}
      </Text>

      <AlertBanner variant="notice" description={t.notReady} />

      <View className="grow" />

      <Button className="mt-6" onPress={() => void leave()} variant="outline">
        <Text>{t.signOut}</Text>
      </Button>
    </ScrollView>
  )
}

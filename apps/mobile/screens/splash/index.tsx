import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Redirect } from "expo-router"
import { Lock } from "lucide-react-native"
import { useEffect, useState } from "react"
import { Image, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { useSetupEvidence } from "@/hooks/use-setup-evidence"
import { routeForStep } from "@/lib/setup-routes"
import { usePreferences } from "@/stores/preferences"

/** Long enough for the mark to register, short enough not to feel like a wait. */
const MINIMUM_HOLD_MS = 600

/**
 * 1.1 — the boot router.
 *
 * Reads the session, the keyring and the device keystore, then sends the user
 * to whichever step their evidence says they are on. Every branch of the
 * resume table in `lib/setup-flow` funnels through here, so this screen is the
 * only place that decides where a cold start lands.
 *
 * It holds for a beat rather than redirecting the instant the probe returns:
 * on a warm start the answer arrives in a few milliseconds and the brand mark
 * would flash. If the probe is slower than the floor, the mark simply stays —
 * it is never a reason to block.
 */
export function SplashScreen() {
  const { t } = useStrings("splash")
  const { loading, step } = useSetupEvidence()
  const hasSeenWelcome = usePreferences((state) => state.hasSeenWelcome)
  const [held, setHeld] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHeld(true), MINIMUM_HOLD_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!loading && held) {
    return <Redirect href={routeForStep(step, hasSeenWelcome)} />
  }

  return (
    <View className="flex-1 items-center bg-background px-8 py-10">
      {/* One lockup, optically centred, with nothing competing against it.
          The screen holds for well under a second, so a tagline here is copy
          nobody finishes reading — and it made the same promise as the pill
          below. The ribbon mark already carries the Latin name, so the
          tracked `WASSIYA` that used to sit under «وصيّة» said it twice. */}
      <View className="flex-1 items-center justify-center gap-5">
        <Image
          /* Metro resolves assets through require(). SDK 56 ships no `*.png`
             module declaration, so an ES import would not typecheck. */
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require("../../assets/images/brand-mark.png")}
          className="h-22 w-44"
          resizeMode="contain"
        />
        <Text className="font-heading-black text-display">وصيّة</Text>
      </View>

      {/* The one claim worth making on a launch screen, held to the bottom
          edge so it reads as a footnote rather than part of the lockup. */}
      <View className="flex-row items-center gap-1.75 rounded-full bg-olive-100 px-3.5 py-1.75">
        <Icon as={Lock} className="size-3.25 text-olive-800" />
        <Text className="text-metasm text-olive-800">{t.encrypted}</Text>
      </View>
    </View>
  )
}

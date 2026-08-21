import "../src/global.css"

import { ClerkProvider, useAuth } from "@clerk/expo"
import { tokenCache } from "@clerk/expo/token-cache"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { PortalHost } from "@rn-primitives/portal"

import { useAppFonts } from "@/src/hooks/use-app-fonts"
import { initLayoutDirection } from "@/src/lib/direction"

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to apps/mobile/.env.local")
}

// RTL is set natively by the expo-localization plugin in app.json
// (`forcesRTL: true`), which is what makes a fresh install mirrored on its
// FIRST launch. This call only backstops JS contexts that config cannot reach
// — Expo Go, a dev client built before the plugin was added, web. It runs at
// module scope because React Native latches direction when it creates native
// views, so a component body is already too late.
//
// A `true` return means the native config did not apply and the current render
// is mis-mirrored until the app reloads. Surfaced rather than swallowed: in a
// proper build this is always false, so it firing is a signal to rebuild the
// dev client, not something to paper over.
if (initLayoutDirection()) {
  console.warn(
    "[wassiya] Layout direction was corrected from JS. The native RTL config " +
      "did not apply — rebuild the dev client (expo prebuild + run:android/ios). " +
      "Until then this session renders left-to-right."
  )
}

// Hold the native splash until the type stack is ready — text rendered in the
// system face and then reflowed to Cairo/Plex is a visible, cheap-looking jump.
void SplashScreen.preventAutoHideAsync()

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
})

export default function RootLayout() {
  const fontsReady = useAppFonts()

  if (!fontsReady) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={() => void SplashScreen.hideAsync()}>
      {/* `tokenCache` persists the session in the device keychain (via
          expo-secure-store), so it survives app restarts. Never AsyncStorage.
          ClerkProvider also calls WebBrowser.maybeCompleteAuthSession() for
          the SSO flow — don't add that call yourself. */}
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <Stack>
            <Stack.Screen name="index" options={{ title: "Convex Starter" }} />
            <Stack.Screen name="sso-callback" options={{ headerShown: false }} />
          </Stack>
          {/* Overlay teleport target for dialog / dropdown-menu / popover / select. */}
          <PortalHost />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </GestureHandlerRootView>
  )
}

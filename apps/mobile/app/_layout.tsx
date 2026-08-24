import "../global.css"

import { useEffect } from "react"

import { ClerkProvider, useAuth } from "@clerk/expo"
import { tokenCache } from "@clerk/expo/token-cache"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as SplashScreen from "expo-splash-screen"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { PortalHost } from "@rn-primitives/portal"

import { MissingEnv } from "@/components/missing-env"
import { SafeAreaShell } from "@/components/safe-area-shell"
import { useAppFonts } from "@/hooks/use-app-fonts"
import { initLayoutDirection } from "@/lib/direction"

// Read, but never throw. A module-scope throw here costs this module its
// default export, and expo-router then reports *every* route in the tree as
// "missing the required default export" — burying a one-line configuration
// problem under a page of unrelated failures. Missing config is a normal state
// on a fresh clone; it gets a screen, not a crash.
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL

const missingEnv = [
  publishableKey ? null : "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
  convexUrl ? null : "EXPO_PUBLIC_CONVEX_URL",
].filter((name): name is string => name !== null)

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

// Constructed only when there is a URL to construct it from — the client
// validates its argument and would throw at module scope otherwise, which is
// the same trap as the key check above.
const convex =
  convexUrl === undefined
    ? null
    : new ConvexReactClient(convexUrl, { unsavedChangesWarning: false })

export default function RootLayout() {
  const fontsReady = useAppFonts()
  const ready = fontsReady || missingEnv.length > 0

  // Hiding the splash belongs in an effect, not in a child's `onLayout`.
  // While the tree below renders `null` no child exists to lay out, so an
  // onLayout-driven hide can never fire — and a held splash over an empty tree
  // is an unexplained black screen with nothing in the logs.
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  // Before the font gate: an unconfigured app should explain itself even if
  // the type stack never loads.
  if (missingEnv.length > 0) return <MissingEnv missing={missingEnv} />

  if (!fontsReady) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Dark glyphs: every screen in the product sits on the cream ground,
            and the status bar is drawn over that same ground below. */}
        <StatusBar style="dark" />

        {/* Insets once, at the root, rather than per screen. */}
        <SafeAreaShell>
          {/* `tokenCache` persists the session in the device keychain (via
              expo-secure-store), so it survives app restarts. Never
              AsyncStorage. ClerkProvider also calls
              WebBrowser.maybeCompleteAuthSession() for the SSO flow — don't
              add that call yourself. */}
          <ClerkProvider
            publishableKey={publishableKey!}
            tokenCache={tokenCache}
          >
            <ConvexProviderWithClerk client={convex!} useAuth={useAuth}>
              {/* Route *gating* is not this layout's job: `index` reads the
                  evidence and redirects, and `auth/` and `setup/` each guard
                  themselves. */}
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="setup" />
                <Stack.Screen name="recovery" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="sso-callback" />
              </Stack>
              {/* Overlay teleport target for dialog / dropdown-menu /
                  popover / select. */}
              <PortalHost />
            </ConvexProviderWithClerk>
          </ClerkProvider>
        </SafeAreaShell>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

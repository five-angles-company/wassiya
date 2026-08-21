import "../src/global.css"

import { ClerkProvider, useAuth } from "@clerk/expo"
import { tokenCache } from "@clerk/expo/token-cache"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { Stack } from "expo-router"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { PortalHost } from "@rn-primitives/portal"

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to apps/mobile/.env.local")
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
})

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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

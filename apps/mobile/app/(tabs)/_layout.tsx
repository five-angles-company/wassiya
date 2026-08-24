import { useConvexAuth } from "convex/react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Redirect, Tabs } from "expo-router"
import { Home, Settings, Users, Wallet } from "lucide-react-native"

import { useStrings } from "@/i18n/use-strings"

/**
 * The app's resting state — **a stub**. Sections ٣–٥ fill these in; this shell
 * exists so onboarding has somewhere real to land.
 *
 * It gates only on having a session. The vault-readiness gate lives on the
 * splash: a signed-in user whose evidence says setup is unfinished never
 * reaches this layout, because `/` routes them into `/setup/…` first.
 */
export default function TabsLayout() {
  const { t } = useStrings("tabs")
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (!isLoading && !isAuthenticated) return <Redirect href="/" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#c67139",
        tabBarInactiveTintColor: "#82796a",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.home,
          tabBarIcon: ({ color }) => <Icon as={Home} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: t.assets,
          tabBarIcon: ({ color }) => <Icon as={Wallet} color={color} />,
        }}
      />
      <Tabs.Screen
        name="heirs"
        options={{
          title: t.heirs,
          tabBarIcon: ({ color }) => <Icon as={Users} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarIcon: ({ color }) => <Icon as={Settings} color={color} />,
        }}
      />
    </Tabs>
  )
}

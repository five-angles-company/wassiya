import { useConvexAuth } from "convex/react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Redirect, Tabs } from "expo-router"
import {
  Home,
  ScrollText,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react-native"

import { useVaultAutoLock } from "@/hooks/use-vault-autolock"
import { useStrings } from "@/i18n/use-strings"

/**
 * The app's resting state.
 *
 * **Five tabs, not four.** The bar rendered in the board's own 4.1 screenshot
 * is الرئيسية · الأصول · الوصيّة · الحماية · الإعدادات; this app shipped four
 * because the shell was written before anyone had read a screen that contained
 * it. الوصيّة (section ٥) is the tab the heirs list lives *inside*, and الحماية
 * (section ٦) is its own destination, not a row on another screen.
 *
 * It gates only on having a session. The vault-readiness gate lives on the
 * splash: a signed-in user whose evidence says setup is unfinished never
 * reaches this layout, because `/` routes them into `/setup/…` first.
 *
 * Auto-lock is mounted **here** rather than per screen. The vault is only
 * reachable through these tabs, so one timer covers all of them, where a
 * per-screen hook would run one per mounted route and lock on whichever fired
 * first.
 */
export default function TabsLayout() {
  const { t } = useStrings("tabs")
  const { isAuthenticated, isLoading } = useConvexAuth()

  useVaultAutoLock()

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
        name="will"
        options={{
          title: t.will,
          tabBarIcon: ({ color }) => <Icon as={ScrollText} color={color} />,
        }}
      />
      <Tabs.Screen
        name="protection"
        options={{
          title: t.protection,
          tabBarIcon: ({ color }) => <Icon as={ShieldCheck} color={color} />,
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

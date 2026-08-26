import { useConvexAuth } from "convex/react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Redirect, Tabs } from "expo-router"
import {
  Home,
  Users,
  Settings,
  Wallet,
} from "lucide-react-native"

import { useVaultAutoLock } from "@/hooks/use-vault-autolock"
import { useStrings } from "@/i18n/use-strings"

/**
 * The app's resting state.
 *
 * **Four tabs, and they are the user's questions rather than the domain's
 * nouns.** الرئيسية (would this work?) · الخزنة (what's in it?) · خطتي (who
 * gets it?) · حسابي (everything about me).
 *
 * It was five. الحماية went because it duplicated الرئيسية outright — both
 * rendered the same protection-score object, so "how protected am I?" was
 * answered in two places and owned by neither. Home's tile grid is that answer
 * now; the Protection Centre screen is gone and its sub-routes
 * (`/protection/checkin`, `/protection/claim`, `/protection/guardian`) are
 * pushed destinations reached from the tab that owns them.
 *
 * الوصيّة → خطتي → الورثة, and the route followed each time. `will.tsx`
 * rendered `HeirsScreen`, so the tab was named for a document it never held;
 * `plan` was broad enough to absorb anything, and did — routing and the
 * guardian both accreted onto it. The tab now owns **people you name to
 * receive**, and nothing else. Routing is asset division and lives at
 * `/plan/routing`, reached from Home and the vault; the guardian verifies
 * rather than inherits, and is reached from Home.
 *
 * A note for anyone comparing this to the design board: the board's 4.1
 * screenshot draws five tabs. The owner directed a ground-up redesign that
 * supersedes it — see the plan in `.claude/plans/`.
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
        // Declared, not inherited. The bar was white only because React
        // Navigation's DefaultTheme is — a theme this app never opted into,
        // which would change the bar's colour if it were ever swapped.
        //
        // The bar carries this white down through the gesture-bar inset on its
        // own; `SafeAreaShell` deliberately stops reserving that space inside
        // `(tabs)` so the sand ground cannot show beneath it.
        tabBarStyle: {
          backgroundColor: "#ffffff",
          // The app's own `--color-border`, as a literal because this is a
          // style object rather than a Uniwind class. White against the sand
          // ground needs the seam; without it the bar floats.
          borderTopColor: "rgba(32, 30, 29, 0.16)",
        },
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

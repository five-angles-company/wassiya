import { useConvexAuth } from "convex/react"
import { Redirect, Tabs } from "expo-router"
import {
  Home,
  Users,
  Settings,
  Wallet,
} from "lucide-react-native"

import { TabBarIcon } from "@/components/tab-bar-icon"
import { TabBarLabel } from "@/components/tab-bar-label"
import { useVaultAutoLock } from "@/hooks/use-vault-autolock"
import { useStrings } from "@/i18n/use-strings"

/**
 * The app's resting state.
 *
 * **Four tabs, and they are the user's questions rather than the domain's
 * nouns.** الرئيسية (would this work?) · الخزنة (what's in it?) · خطتي (who gets
 * it?) · حسابي (everything about me).
 *
 * الحماية was removed because it duplicated الرئيسية outright — both rendered
 * the same protection-score object, so "how protected am I?" was answered in two
 * places and owned by neither. Home's tile grid is that answer;
 * `/protection/checkin`, `/protection/claim` and `/protection/guardian` are
 * pushed destinations reached from the tab that owns them.
 *
 * خطتي owns **people you name to receive**, and nothing else. Routing is asset
 * division and belongs to ٤.١, which groups by type and filters by "بلا مستلم";
 * the guardian verifies rather than inherits, and is reached from Home. (The
 * the original ٤.١ design drew five tabs — the owner directed a ground-up
 * redesign that supersedes it; see `.claude/plans/`.)
 *
 * This layout gates only on having a session. The vault-readiness gate lives on
 * the splash, so a signed-in user whose evidence says setup is unfinished never
 * reaches here.
 *
 * Auto-lock is mounted **here** rather than per screen: the vault is only
 * reachable through these tabs, so one timer covers all of them where a
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
        // No tint colours and no label style: `TabBarIcon` and `TabBarLabel`
        // render both halves themselves, so those would set values nothing
        // reads. Colour and weight live with the components that draw them,
        // where they can use the app's tokens instead of literals.
        // Declared, not inherited. The bar was **white** only because React
        // Navigation's DefaultTheme is — a theme this app never opted into —
        // and it was the one pure-white surface in a product built entirely
        // from sand and card.
        //
        // `sand-100` replaces it rather than `background`: the bar should still
        // read as *raised* above the page, which is the one thing the white was
        // doing right. A hair lighter than the ground lifts it; matching the
        // ground would let the list appear to run off the bottom of the screen.
        //
        // The bar carries this colour down through the gesture-bar inset on its
        // own; `SafeAreaShell` deliberately stops reserving that space inside
        // `(tabs)` so the sand ground cannot show beneath it.
        tabBarStyle: {
          backgroundColor: "#f9f4ed",
          // The app's own `--color-border`, as a literal because this is a
          // style object rather than a Uniwind class. The seam is what keeps
          // two close sand tones from bleeding into one another.
          borderTopColor: "rgba(32, 30, 29, 0.16)",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.home,
          tabBarLabel: ({ focused }) => (
            <TabBarLabel label={t.home} focused={focused} />
          ),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon={Home} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: t.assets,
          tabBarLabel: ({ focused }) => (
            <TabBarLabel label={t.assets} focused={focused} />
          ),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon={Wallet} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="heirs"
        options={{
          title: t.heirs,
          tabBarLabel: ({ focused }) => (
            <TabBarLabel label={t.heirs} focused={focused} />
          ),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon={Users} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarLabel: ({ focused }) => (
            <TabBarLabel label={t.settings} focused={focused} />
          ),
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon={Settings} focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}

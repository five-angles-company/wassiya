import { ScrollView, Text, View } from "react-native"

export type MissingEnvProps = {
  /** Names of the `EXPO_PUBLIC_*` vars that are absent. */
  missing: string[]
}

/**
 * What the app renders when it has no configuration to start from.
 *
 * Deliberately built from bare `react-native` primitives with inline styles and
 * hard-coded English: it has to render when *nothing* is wired up, so it may
 * not touch Convex (no deployment), `useStrings` (reads the profile through
 * Convex), or any themed component (they resolve tokens through the Uniwind
 * runtime). Anything with a dependency could fail for the same reason the app
 * already failed and leave a blank screen instead of an explanation.
 *
 * This replaces a module-scope `throw`. That throw made the layout module fail
 * to evaluate, which cost it its default export — so expo-router reported
 * "missing the required default export" for every route in the tree and the
 * real one-line cause was buried under forty lines of cascade.
 */
export function MissingEnv({ missing }: MissingEnvProps) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f5ead8" }}
      contentContainerStyle={{ padding: 28, paddingTop: 72 }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: "800",
          color: "#201e1d",
          marginBottom: 10,
        }}
      >
        Wassiya isn&apos;t configured yet
      </Text>

      <Text
        style={{
          fontSize: 15,
          lineHeight: 23,
          color: "#645c50",
          marginBottom: 22,
        }}
      >
        Create <Text style={{ fontWeight: "700" }}>apps/mobile/.env.local</Text>{" "}
        with the variables below, then restart Metro with{" "}
        <Text style={{ fontWeight: "700" }}>--clear</Text>. Values are read at
        bundle time, so a plain reload will not pick them up.
      </Text>

      {missing.map((name) => (
        <View
          key={name}
          style={{
            backgroundColor: "#ffe1d0",
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginBottom: 10,
          }}
        >
          <Text
            style={{ fontSize: 13, color: "#8c491a", fontFamily: "monospace" }}
          >
            {name}
          </Text>
        </View>
      ))}

      <Text
        style={{
          fontSize: 13,
          lineHeight: 21,
          color: "#645c50",
          marginTop: 18,
        }}
      >
        The Convex URL comes from `npx convex dev` in packages/backend. The
        Clerk publishable key comes from your Clerk dashboard under API keys.
        See apps/mobile/.env.example.
      </Text>
    </ScrollView>
  )
}

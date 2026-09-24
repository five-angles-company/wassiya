// Lock-screen notices through Expo's push service. Title and body only: a push
// is read by whoever holds the phone, so it says that something is waiting and
// never what.
import { v } from "convex/values"

import { internalAction } from "../_generated/server"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

export const send = internalAction({
  args: {
    tokens: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    /** Where the app should open, e.g. `/settings/help/<id>`. Not content. */
    path: v.string(),
  },
  handler: async (_ctx, { tokens, title, body, path }) => {
    if (tokens.length === 0) return null
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        tokens.map((to) => ({ to, title, body, sound: "default", data: { path } }))
      ),
    })
    if (!response.ok) {
      console.error(`Expo push failed with status ${response.status}`)
    }
    return null
  },
})

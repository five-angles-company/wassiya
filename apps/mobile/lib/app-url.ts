/**
 * The origin of the guardian and heir web app.
 *
 * Only the guardian invitation needs it: the owner shares that message from
 * their own device, so the link has to be composed here rather than by the
 * backend, which composes every *email* link from `APP_URL` on the deployment.
 * The two are the same value in two env stores — see the README's table.
 *
 * Falls back to the invitation reading as a bare code rather than to a wrong
 * origin. A link to the wrong host is worse than no link: it looks actionable
 * and is not.
 */
const RAW = process.env.EXPO_PUBLIC_APP_URL

export const APP_URL: string | null =
  typeof RAW === "string" && RAW.length > 0 ? RAW.replace(/\/+$/, "") : null

/** The page that turns an invite token into an accepted guardianship. */
export function guardianAcceptUrl(token: string): string | null {
  if (APP_URL === null) return null
  return `${APP_URL}/guardian/accept?token=${encodeURIComponent(token)}`
}

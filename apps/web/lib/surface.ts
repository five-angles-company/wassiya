/**
 * Which of the two worlds a path belongs to.
 *
 * Two readers share this deployment and they are not the same person — an heir
 * is mid-bereavement in a ten-minute flow, a guardian is doing admin they last
 * thought about four years ago.
 *
 * Only the guardian's world is listed. The heir's routes left `(app)` entirely
 * for `app/(case)`, which sits outside the sign-in wall and stamps its own
 * surface on its own layout — so nothing above it has to be told.
 *
 * **This map and `app/(app)/(guardian)` are one decision in two places.** Moving
 * a route between groups without moving it here leaves a page whose bar
 * disagrees with the page under it, and nothing fails — so change both or
 * neither.
 *
 * `null` is the third answer and the common one: home, the account and the
 * notification feed belong to whoever is reading them, and take the default
 * terracotta. A shared screen tinted for one audience tells the other they are
 * somewhere they are not.
 */
export type Surface = "heir" | "guardian"

const PREFIXES: ReadonlyArray<readonly [Surface, string]> = [
  ["guardian", "/guardian"],
]

export function surfaceFor(pathname: string): Surface | null {
  for (const [surface, prefix] of PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return surface
  }
  return null
}

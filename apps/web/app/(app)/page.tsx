import { GuardianStanding } from "@/features/guardian/components/guardian-standing"
import { CaseRouter } from "@/features/overview/components/case-router"

/**
 * The front door.
 *
 * A thin route: the decision needs four Convex subscriptions and has to be
 * taken on the client, so the whole of it lives in `CaseRouter`. Server-side
 * routing would need a `ConvexHttpClient` and a Clerk token round trip in the
 * layout — a new pattern in this repo, for one screen.
 *
 * ## ⚠️ It composes the guardian's standing state rather than letting the
 * router import it
 *
 * A guardian with vaults and nothing in flight used to be redirected to
 * `/guardian`; that route is gone and its content is one of `/`'s answers now.
 * But `features/overview` may not import `features/guardian` —
 * `no-restricted-paths` says a feature imports itself and nothing else under
 * `features/` — so the node is passed in from here, where composing features is
 * what a route is for.
 */
export default function HomePage() {
  return <CaseRouter guardianStanding={<GuardianStanding />} />
}

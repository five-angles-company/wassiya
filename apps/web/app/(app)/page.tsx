import { CaseRouter } from "@/features/overview/components/case-router"

/**
 * The front door. A thin route: the decision needs Convex subscriptions and is
 * taken on the client, so the whole of it lives in `CaseRouter`.
 */
export default function HomePage() {
  return <CaseRouter />
}

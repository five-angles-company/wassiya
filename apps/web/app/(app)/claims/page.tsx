import { ClaimsList } from "@/features/claims/components/claims-list"

/**
 * The reports list.
 *
 * A thin route with no header of its own. The header is the populated case's
 * chrome and the empty case has none — that decision needs the row count, which
 * only the subscription has, so `ClaimsList` owns the whole screen. Rendering a
 * header here as well is what put "بلاغ جديد" on the page twice.
 */
export default function ClaimsPage() {
  return <ClaimsList />
}

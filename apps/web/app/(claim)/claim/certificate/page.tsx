import type { Metadata } from "next"

import { CertificateFlow } from "@/components/claim/certificate-flow"
import { CLAIM_CERTIFICATE } from "@/lib/claim-copy"

/**
 * ٧.٣ — `/claim/certificate`. Step 2 of 3.
 *
 * A thin route around a client component: the screen is a file drop and a form,
 * both of which need the browser. The landing (7.1) and the status page (7.4)
 * stay server-rendered, which is where that property actually matters.
 */
/**
 * Never prerendered: every one of these screens reads per-user Convex state,
 * so a build-time snapshot could only ever be wrong. Marking it explicitly also
 * keeps the production build from depending on runtime env vars being present
 * at build time, which is what a static pass would force.
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: CLAIM_CERTIFICATE.metaTitle,
  robots: { index: false, follow: false },
}

export default function ClaimCertificatePage() {
  return <CertificateFlow />
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageColumn } from "@/components/page-column"
import { PreviewGallery } from "@/app/dev/preview/preview-gallery"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Development only: every screen state that needs a real session or real data
 * (the doors, the case list, each report state, the box step), drawn from
 * sample props so they can be checked — and screenshotted — without either.
 */
export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound()
  return (
    <PageColumn>
      <PreviewGallery />
    </PageColumn>
  )
}

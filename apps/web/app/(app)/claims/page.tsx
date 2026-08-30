import Link from "next/link"
import { FilePlus2Icon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { ClaimsList } from "@/features/claims/components/claims-list"
import { CLAIMS } from "@/features/claims/strings/claims"

export default async function ClaimsPage() {
  const labels = t(CLAIMS, await getLocale())

  return (
    <>
      <PageHeader
        title={labels.listTitle}
        description={labels.listBody}
        action={
          <Link
            href="/claims/new"
            className="bg-primary text-primary-foreground hover:bg-terracotta-600 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[14.5px] font-semibold transition-colors"
          >
            <FilePlus2Icon className="size-4" strokeWidth={2.4} aria-hidden />
            {labels.newReport}
          </Link>
        }
      />
      <ClaimsList />
    </>
  )
}

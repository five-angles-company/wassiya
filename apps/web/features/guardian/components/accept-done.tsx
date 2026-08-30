"use client"

import Link from "next/link"
import { CheckIcon } from "lucide-react"

import { Panel } from "@/components/panel"
import type { Resolved } from "@/lib/i18n/locale"
import type { GUARDIAN } from "@/features/guardian/strings/guardian"

/**
 * Accepted.
 *
 * The copy's job here is to set an expectation that will hold for years:
 * nothing is required until we ask, and we probably will not ask soon. A
 * guardian who leaves this screen expecting periodic activity is a guardian who
 * stops reading our email.
 */
export function AcceptDone({ labels }: { labels: Resolved<typeof GUARDIAN> }) {
  return (
    <Panel tone="settled" icon={CheckIcon} title={labels.doneTitle}>
      <p className="mb-6 max-w-[62ch] text-[15px] leading-[1.72] opacity-90">
        {labels.doneBody}
      </p>
      <Link
        href="/guardian"
        className="text-secondary font-heading inline-flex h-[54px] items-center rounded-full bg-[color:var(--secondary-foreground)] px-8 text-[16px] font-extrabold"
      >
        {labels.doneAction}
      </Link>
    </Panel>
  )
}

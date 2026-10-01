import type { CSSProperties, ReactNode } from "react"
import { SmartphoneIcon, UserRoundIcon } from "lucide-react"

import { DocTitle } from "@/components/doc/title"
import { IconDisc } from "@/components/icon-disc"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { AUTH } from "@/lib/i18n/strings/auth"
import { landingUrl } from "@/lib/landing-url"

/**
 * Sign-in and sign-up: what the account is for beside the form, stacked on a
 * phone. Clerk renders with `elevation: "flush"` (no card of its own — see the
 * root layout), so the card here is ours and matches every other surface.
 */
export async function AuthShell({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const labels = t(AUTH, locale)

  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-10 px-4 pt-10 pb-24 md:px-8 md:pt-16 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-x-20 lg:gap-y-8">
      <div className="lg:self-end">
        <DocTitle eyebrow={labels.pageEyebrow} eyebrowIcon={UserRoundIcon} title={labels.pageTitle} lead={labels.pageLead} />
      </div>

      <div className="rise-in bg-card border-border rounded-panel border p-7 shadow-[var(--shadow-overlay)] md:p-9 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
        {children}
      </div>

      {/* Below the form on a phone, so the form is not pushed down; beside it on a wide screen. */}
      <div
        className="rise flex items-center gap-3.5 lg:border-border lg:self-start lg:border-t lg:pt-6"
        style={{ "--rise-delay": "180ms" } as CSSProperties}
      >
        <IconDisc icon={SmartphoneIcon} size="sm" shape="circle" />
        <p className="text-muted-foreground text-[14.5px] leading-relaxed">
          {labels.ownerNote}{" "}
          <a href={landingUrl(locale, "/#download")} className="text-foreground font-semibold underline-offset-4 hover:underline">
            {labels.ownerLink}
          </a>
        </p>
      </div>
    </div>
  )
}

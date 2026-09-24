"use client"

import { HeartHandshakeIcon, MailOpenIcon, ShieldAlertIcon, SmartphoneIcon } from "lucide-react"

import { ButtonLink } from "@/components/button"
import { DocTitle } from "@/components/doc/title"
import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { HOME } from "@/features/overview/strings/home"

/**
 * An account with nothing in it yet: the two reasons anyone comes here.
 *
 * The two doors are not equal and must not look it — one leads somewhere, the
 * other is an instruction. The report door holds the screen's only button; the
 * heir door deliberately has none, because a delivery opens from the link we
 * sent, and a button here could only lead to "we need your link".
 */
export function WelcomeDoors({ name }: { name: string | null }) {
  const labels = t(HOME, useLocale())

  return (
    <div className="flex flex-col gap-8">
      <DocTitle
        title={name === null ? labels.greetingAnonymous : labels.greeting.replace("{name}", name)}
        lead={labels.chooseBody}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rise-in bg-card border-border rounded-panel flex flex-col items-start border p-7 shadow-[var(--shadow-raised)] md:p-8">
          <IconDisc icon={HeartHandshakeIcon} tone="attention" size="lg" />
          <h2 className="font-heading mt-6 text-[23px] leading-snug font-black">{labels.doorClaimTitle}</h2>
          <p className="text-foreground/75 mt-3 text-[15.5px] leading-[1.85]">{labels.doorClaimBody}</p>
          <p className="text-muted-foreground mt-4 text-[13.5px] font-semibold">{labels.doorClaimMeta}</p>
          <div className="mt-auto pt-7">
            <ButtonLink href="/file" size="lg">
              {labels.doorClaimAction}
            </ButtonLink>
          </div>
        </section>

        <section className="rise-in bg-card border-border rounded-panel flex flex-col items-start border p-7 shadow-[var(--shadow-raised)] md:p-8">
          <IconDisc icon={MailOpenIcon} tone="settled" size="lg" />
          <h2 className="font-heading mt-6 text-[23px] leading-snug font-black">{labels.doorHeirTitle}</h2>
          <p className="text-foreground/75 mt-3 text-[15.5px] leading-[1.85]">{labels.doorHeirBody}</p>
          <p className="text-tone-settled mt-4 text-[14px] font-semibold">{labels.doorHeirMeta}</p>
          <p className="bg-tone-attention-soft text-tone-attention rounded-row mt-5 flex items-start gap-3 px-4 py-3 text-[14px] leading-[1.7] font-semibold">
            <ShieldAlertIcon className="mt-0.5 size-5 shrink-0" strokeWidth={2.25} aria-hidden />
            {labels.doorHeirWarning}
          </p>
        </section>
      </div>

      <div className="bg-card/60 border-border rounded-row flex items-start gap-4 border p-5">
        <IconDisc icon={SmartphoneIcon} size="sm" />
        <p className="text-foreground/75 text-[14.5px] leading-[1.75]">
          <span className="text-foreground font-bold">{labels.ownerTitle}</span> — {labels.ownerBody}
        </p>
      </div>
    </div>
  )
}

"use client"

import { ButtonLink } from "@/components/button"
import { Prose } from "@/components/doc/prose"
import { DocTitle } from "@/components/doc/title"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { HOME } from "@/features/overview/strings/home"

/**
 * The screen for someone who has just arrived and has nothing yet — not a
 * dashboard with zero rows but a fork with exactly two ways forward.
 *
 * The two doors are not peers: one is an action this app can take today, the
 * other an instruction to go and find an email. That difference is carried by
 * heading size and by the single button on the screen, not by boxes — the
 * version this replaced gave each door a card, a coloured medallion and a
 * shadow, which made two unequal things look like a choice between equals.
 */
export function WelcomeDoors({ name }: { name: string | null }) {
  const labels = t(HOME, useLocale())

  return (
    <div className="flex flex-col gap-11">
      <DocTitle
        title={
          name === null
            ? labels.greetingAnonymous
            : labels.greeting.replace("{name}", name)
        }
      />

      <Prose>
        <p>{labels.chooseBody}</p>
      </Prose>

      {/* The door that leads somewhere. */}
      <section className="border-border flex flex-col gap-4 border-t pt-7">
        <h2 className="font-heading text-[23px] leading-tight font-extrabold md:text-[26px]">
          {labels.doorClaimTitle}
        </h2>
        <Prose>
          <p>{labels.doorClaimBody}</p>
        </Prose>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
          <ButtonLink href="/file">{labels.doorClaimAction}</ButtonLink>
          <span className="text-muted-foreground text-[13.5px]">
            {labels.doorClaimMeta}
          </span>
        </div>
      </section>

      {/* The door that is really an instruction. Deliberately not a link: a
          delivery opens from the link we sent the heir, so a button here could
          only lead to a screen saying "we need your link". */}
      <section className="border-border flex flex-col gap-3 border-t pt-7">
        <h2 className="font-heading text-[19px] leading-tight font-extrabold">
          {labels.doorHeirTitle}
        </h2>
        <Prose>
          <p className="text-muted-foreground">{labels.doorHeirBody}</p>
        </Prose>
        <p className="text-tone-settled text-[14px] font-semibold">
          {labels.doorHeirMeta}
        </p>
      </section>

      {/* The owner, who is on the wrong device. A footnote, and sized like one:
          it was a full-width card, which gave it the same weight as the two
          things the screen is actually for. */}
      <p className="text-muted-foreground border-border border-t pt-6 text-[13.5px] leading-[1.7]">
        <span className="text-foreground font-semibold">
          {labels.ownerTitle}
        </span>{" "}
        — {labels.ownerBody}
      </p>
    </div>
  )
}

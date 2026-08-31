"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  FilePlus2Icon,
  ShieldCheckIcon,
  SmartphoneIcon,
} from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { HOME } from "@/features/overview/strings/home"

/**
 * The screen for someone who has just arrived and has nothing yet.
 *
 * ## Why it is its own screen and not an empty list
 *
 * A person with no report and no guardianship is not a dashboard with zero
 * rows — they are at a fork, and there are exactly two ways forward. Rendering
 * that as a stack of cards under a greeting, top-aligned, left three quarters
 * of the viewport empty and made the fork look like leftovers.
 *
 * So this composition **owns the viewport**: it centres in the space the bar
 * leaves, and the greeting is part of it rather than a heading floating above
 * it. `100svh` rather than `100vh` because mobile browsers shrink the visual
 * viewport when their own chrome appears, and `vh` would put the second door
 * under the address bar.
 *
 * ## The two doors are not peers
 *
 * One is an action this app can take today; the other is an instruction to go
 * and find an email. Giving them equal cards said they were the same kind of
 * thing. The report door takes three of five columns, the accent ground, a
 * solid medallion and the only button on the screen; the guardian door is a
 * quiet card that explains why there is nothing to press.
 *
 * ## Depth, because the palette has it and nothing was using it
 *
 * The Organic ground and its surface are four percent of lightness apart, which
 * is why flat fills on it read as discoloured patches rather than as cards.
 * `--shadow-raised` exists for exactly this — a deep brown rather than black,
 * so it stays in the same family as the ink — and `.lift` answers the pointer.
 * Both were added to the stylesheet and then never reached for.
 *
 * `.rise` staggers the three blocks on load. One motion, used everywhere, is
 * what keeps a page feeling composed rather than twitchy — and it is CSS, so
 * the screen still renders with JavaScript off.
 */
export function WelcomeDoors({ name }: { name: string | null }) {
  const labels = t(HOME, useLocale())

  return (
    <div className="flex min-h-[calc(100svh-3.5rem-3rem)] flex-col justify-center py-4 md:min-h-[calc(100svh-3.5rem-4rem)]">
      <header className="rise mb-8 md:mb-10" style={{ "--rise-delay": "0ms" } as React.CSSProperties}>
        <h1 className="font-heading text-[28px] leading-tight font-extrabold md:text-[34px]">
          {name === null
            ? labels.greetingAnonymous
            : labels.greeting.replace("{name}", name)}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-[54ch] text-[15px] leading-[1.75] md:text-[15.5px]">
          {labels.chooseBody}
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-5">
        {/* The door that leads somewhere. */}
        <section
          className="rise lift bg-accent text-accent-foreground rounded-sheet border-terracotta-200 flex flex-col border p-7 shadow-[var(--shadow-raised)] md:col-span-3 md:p-9"
          style={{ "--rise-delay": "70ms" } as React.CSSProperties}
        >
          <span
            aria-hidden
            className="bg-primary text-primary-foreground mb-6 grid size-14 shrink-0 place-items-center rounded-full shadow-[var(--shadow-raised)]"
          >
            <FilePlus2Icon className="size-6" strokeWidth={2.2} />
          </span>

          <h2 className="font-heading text-[22px] leading-tight font-extrabold md:text-[26px]">
            {labels.doorClaimTitle}
          </h2>
          <p className="mt-3 max-w-[46ch] flex-1 text-[15px] leading-[1.75] opacity-80">
            {labels.doorClaimBody}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/claims/new"
              className="group bg-primary text-primary-foreground hover:bg-terracotta-600 font-heading inline-flex h-14 items-center gap-3 rounded-full px-8 text-[17px] font-extrabold shadow-[var(--shadow-raised)] transition-colors"
            >
              {labels.doorClaimAction}
              <ArrowRightIcon
                className="nudge size-5 rtl:-scale-x-100"
                strokeWidth={2.75}
                aria-hidden
              />
            </Link>
            <span className="text-[13.5px] leading-[1.5] opacity-65">
              {labels.doorClaimMeta}
            </span>
          </div>
        </section>

        {/* The door that is really an instruction. Deliberately not a link: a
            guardianship opens from the invitation's own token, so a button here
            could only lead to a screen saying "we need your link". */}
        <section
          className="rise lift bg-card rounded-sheet border-border flex flex-col border p-7 shadow-[var(--shadow-raised)] md:col-span-2 md:p-8"
          style={{ "--rise-delay": "140ms" } as React.CSSProperties}
        >
          <span
            aria-hidden
            className="bg-secondary text-secondary-foreground mb-6 grid size-12 shrink-0 place-items-center rounded-full"
          >
            <ShieldCheckIcon className="size-[22px]" strokeWidth={2.2} />
          </span>

          <h2 className="font-heading text-[19px] leading-tight font-extrabold md:text-[21px]">
            {labels.doorGuardianTitle}
          </h2>
          <p className="text-muted-foreground mt-3 flex-1 text-[14.5px] leading-[1.75]">
            {labels.doorGuardianBody}
          </p>
          <p className="text-olive-700 mt-6 text-[13.5px] font-semibold">
            {labels.doorGuardianMeta}
          </p>
        </section>
      </div>

      {/* The owner, who is on the wrong device. One line on the ground tone —
          it was a full-width card, which gave a footnote the same weight as the
          two things the screen is actually for. */}
      <p
        className="rise text-muted-foreground mt-6 flex items-start gap-3 px-1 text-[13.5px] leading-[1.7]"
        style={{ "--rise-delay": "210ms" } as React.CSSProperties}
      >
        <SmartphoneIcon
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={2.2}
          aria-hidden
        />
        <span>
          <span className="text-foreground font-semibold">
            {labels.ownerTitle}
          </span>{" "}
          — {labels.ownerBody}
        </span>
      </p>
    </div>
  )
}

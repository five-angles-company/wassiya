"use client"

import Link from "next/link"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ArrowRightIcon } from "lucide-react"

import { IdentityBadge } from "@/components/identity-badge"
import { OWNERS } from "@/features/owners/strings/owners"
import type { IdentityStatus } from "@/lib/identity"
import { fmtDate } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * Two letters, from the first two words of a name.
 *
 * Script-agnostic on purpose: `charAt(0)` on "فاطمة العتيبي" gives "فا" and on
 * "Fatima Al-Otaibi" gives "FA", so Arabic and Latin names both get an anchor
 * without a transliteration step that would be wrong as often as right.
 */
function initials(name: string | null, fallback: string | null): string {
  const source = name ?? fallback ?? ""
  const words = source.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "—"
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
}

/**
 * The account's identity, and its state at a glance.
 *
 * Replaces a single row that put the back link, the name and the email at the
 * same level in the same type size — three unrelated things reading as one
 * sentence, with no page heading among them. Now the navigation sits above and
 * out of the way, the name is the `h1` this route was missing entirely, and the
 * two facts an operator checks first — is this person verified, and what are
 * they paying — sit on the opposite edge where the eye lands after the name.
 *
 * The back arrow is `ltr:rotate-180`, not `rtl:`. "Back" is leftward in a
 * left-to-right page and rightward in a right-to-left one, so an arrow that
 * already points right needs turning in LTR and leaving alone in RTL.
 */
export function OwnerHeader({
  owner,
  locale,
}: {
  owner: {
    name: string | null
    email: string | null
    country: string | null
    identityStatus: IdentityStatus
    plan: string | null
    joinedAt: number
  }
  locale: Locale
}) {
  const labels = t(OWNERS, locale)

  const meta = [
    owner.country,
    labels.colJoined + " " + fmtDate(owner.joinedAt, locale),
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ms-2 self-start text-muted-foreground"
      >
        <Link href="/owners">
          <ArrowRightIcon className="size-4 ltr:rotate-180" aria-hidden />
          {labels.back}
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback className="font-heading text-sm">
              {initials(owner.name, owner.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate font-heading text-2xl font-bold tracking-tight">
              {owner.name ?? labels.nameNone}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              {/* An address stays LTR inside Arabic prose. */}
              <span dir="ltr" className="inline-block">
                {owner.email}
              </span>
              {meta.map((part) => (
                <span key={part} className="before:me-2 before:content-['·']">
                  {part}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <IdentityBadge status={owner.identityStatus} locale={locale} />
          <Badge variant="outline">{owner.plan ?? labels.planNone}</Badge>
        </div>
      </div>
    </div>
  )
}

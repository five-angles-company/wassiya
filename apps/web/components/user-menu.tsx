"use client"

import Link from "next/link"
import { useClerk, useUser } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The avatar and what opens under it.
 *
 * ## Why this is ours and not `<UserButton>`
 *
 * Clerk's own button was three problems at once, and all three were things CSS
 * could not reach:
 *
 * **The avatar was green.** Clerk serves a generated default from `img.clerk.com`
 * as an `<img>`, coloured from the user id — so the `avatarBox` background
 * override in `app/layout.tsx` was styling a box behind an opaque image. Here
 * the fallback is drawn rather than fetched, and only a real photo (`hasImage`,
 * false for Clerk's generated one) replaces it.
 *
 * **Two rows meant the same thing.** Clerk's "Manage account" sat directly above
 * our "Account", and nothing on either said which was which. Clerk's modal is
 * still here — it owns email, password and the second factor, which `/account`
 * does not — but it is named for what it holds.
 *
 * **It was a card.** Rounded rows, a hard shadow and a "Secured by Clerk"
 * footer, held together by a stack of `!important` rules fighting a stylesheet
 * we do not own. The menu is a small document now, like every other surface.
 *
 * `openUserProfile()` keeps Clerk's modal reachable, so nothing is lost by not
 * rendering their button.
 */
export function UserMenu() {
  const nav = t(NAV, useLocale())
  const { user, isLoaded } = useUser()
  const { openUserProfile, signOut } = useClerk()

  // Clerk renders nothing without a session and neither does this: the corner
  // simply ends after the language switch for a signed-out reader.
  if (!isLoaded || user === null || user === undefined) return null

  const name = user.fullName ?? user.username ?? null
  const email = user.primaryEmailAddress?.emailAddress ?? null
  const initial = (name ?? email ?? "?").trim().charAt(0).toUpperCase()

  const row =
    "w-full cursor-pointer rounded-none px-4 py-3 text-[14.5px] font-medium focus:bg-surface-accent-soft data-highlighted:bg-surface-accent-soft"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={nav.openMenu}
        className="focus-visible:ring-ring grid size-8 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {user.hasImage ? (
          // Clerk's CDN is not in `next.config.ts` remote patterns, and a
          // 32px avatar is not worth a round trip through the optimiser.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="bg-primary text-primary-foreground font-heading grid size-8 place-items-center rounded-full text-[14px] font-extrabold"
          >
            {initial}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="bg-card border-border w-[264px] rounded-xl border p-0 shadow-none ring-0"
      >
        <div className="border-border border-b px-4 py-3.5">
          {name !== null && (
            <p className="font-heading truncate text-[15px] font-bold">{name}</p>
          )}
          {email !== null && (
            <p className="text-muted-foreground ltr-isolate mt-0.5 truncate text-[12.5px]">
              {email}
            </p>
          )}
        </div>

        <DropdownMenuItem asChild className={`${row} border-border border-b`}>
          <Link href="/account">{nav.account}</Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          className={`${row} border-border border-b`}
          onSelect={() => openUserProfile()}
        >
          {nav.security}
        </DropdownMenuItem>

        <DropdownMenuItem
          className={`${row} text-tone-attention`}
          onSelect={() => void signOut({ redirectUrl: "/" })}
        >
          {nav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

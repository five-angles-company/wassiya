"use client"

import { UserButton } from "@clerk/nextjs"
import { UserIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The avatar, and the one link that had nowhere else to go.
 *
 * `/account` is a real route with a real screen — the profile, the identity
 * verdict, and the paragraph naming what this service cannot read — and after
 * the bar replaced the rail it was reachable from **nothing** on a desktop
 * width. The rail had listed it; the bar moved it to `secondary` on the
 * reasoning that an avatar is where readers look for their account, which was
 * only true if the avatar actually led there. It did not: Clerk's own menu
 * offers its account modal and sign-out, and knows nothing about ours.
 *
 * `UserButton.MenuItems` is the fix and the idiomatic place — the link sits in
 * the menu the reader already opened looking for exactly this.
 *
 * A Client Component so the label can come from `useLocale()`. Clerk renders
 * `labelIcon` inside its own menu markup, so the icon is sized to their row
 * rather than to ours.
 */
export function UserMenu() {
  const nav = t(NAV, useLocale())

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          href="/account"
          label={nav.account}
          labelIcon={<UserIcon className="size-4" strokeWidth={2.2} />}
        />
      </UserButton.MenuItems>
    </UserButton>
  )
}

"use client"

import Link from "next/link"
import { useClerk, useUser } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  BellIcon,
  HeartHandshakeIcon,
  HouseIcon,
  LifeBuoyIcon,
  LogOutIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The avatar and its menu. Ours rather than Clerk's `<UserButton>` so it takes
 * the product's surfaces; Clerk's modal still owns email and sign-in methods
 * ("Sign-in & security").
 *
 * The header's destinations are repeated here because the header hides them
 * below `md`, and this menu is the phone's way to them.
 */
export function UserMenu() {
  const nav = t(NAV, useLocale())
  const { user, isLoaded } = useUser()
  const { openUserProfile, signOut } = useClerk()

  if (!isLoaded || user === null || user === undefined) return null

  const name = user.fullName ?? user.username ?? null
  const email = user.primaryEmailAddress?.emailAddress ?? null
  const initial = (name ?? email ?? "?").trim().charAt(0).toUpperCase()

  const links: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/", label: nav.home, icon: HouseIcon },
    { href: "/file", label: nav.reportDeath, icon: HeartHandshakeIcon },
    { href: "/notifications", label: nav.notifications, icon: BellIcon },
    { href: "/account", label: nav.account, icon: UserRoundIcon },
    { href: "/help", label: nav.help, icon: LifeBuoyIcon },
  ]
  const row =
    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium focus:bg-foreground/[0.05] data-highlighted:bg-foreground/[0.05]"
  const icon = "text-muted-foreground size-[18px] shrink-0"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={nav.openMenu}
        className="focus-visible:ring-ring ms-1 grid size-10 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {user.hasImage ? (
          <img src={user.imageUrl} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden
            className="bg-primary text-primary-foreground font-heading grid size-10 place-items-center rounded-full text-[15px] font-extrabold"
          >
            {initial}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="bg-card border-border w-[280px] rounded-[22px] border p-1.5 shadow-[var(--shadow-overlay)] ring-0"
      >
        <div className="px-3 pt-2.5 pb-3">
          {name !== null && <p className="font-heading truncate text-[15.5px] font-extrabold">{name}</p>}
          {email !== null && (
            <p className="text-muted-foreground ltr-isolate mt-0.5 truncate text-[12.5px]">{email}</p>
          )}
        </div>
        <DropdownMenuSeparator className="bg-border mx-1 my-1" />

        {links.map((link) => (
          <DropdownMenuItem key={link.href} asChild className={row}>
            <Link href={link.href}>
              <link.icon className={icon} strokeWidth={2} aria-hidden />
              {link.label}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-border mx-1 my-1" />
        <DropdownMenuItem className={row} onSelect={() => openUserProfile()}>
          <ShieldCheckIcon className={icon} strokeWidth={2} aria-hidden />
          {nav.security}
        </DropdownMenuItem>
        <DropdownMenuItem className={`${row} text-tone-attention`} onSelect={() => void signOut({ redirectUrl: "/" })}>
          <LogOutIcon className="size-[18px] shrink-0 rtl:-scale-x-100" strokeWidth={2} aria-hidden />
          {nav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

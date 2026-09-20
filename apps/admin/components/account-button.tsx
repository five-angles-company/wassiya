"use client"

import { useState } from "react"
import { UserButton, useUser } from "@clerk/nextjs"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"

/**
 * The account control, mounted only when somebody reaches for it.
 *
 * `<UserButton />` is a Clerk-rendered component: mounting it pulls Clerk's UI
 * bundle — several hundred kilobytes from their CDN — and parses it on the main
 * thread. It sits in the header of every console screen, so that cost was being
 * paid on every page load for a menu that is opened once a week.
 *
 * Until then this draws the same 28px avatar from `useUser()`, which is part of
 * Clerk's core and already loaded. Hover, focus or click swaps in the real
 * control; on a desktop console the pointer arrives well before the click, so
 * by the time the menu is wanted it is there. A keyboard user reaching it with
 * Tab triggers the same swap on focus.
 *
 * ⚠️ Not `next/dynamic`: the cost being avoided is Clerk fetching its own
 * bundle at runtime, which code-splitting our side of the import cannot help.
 * The mount itself is the trigger, so the mount is what has to wait.
 */
export function AccountButton() {
  const [wanted, setWanted] = useState(false)
  const { user } = useUser()

  if (wanted) return <UserButton />

  const name = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? ""

  return (
    <button
      type="button"
      // Three ways in, because the swap must never be the reason a click does
      // nothing: pointer for the mouse, focus for the keyboard, click for
      // touch and for anyone who moves fast enough to beat the hover.
      onPointerEnter={() => setWanted(true)}
      onFocus={() => setWanted(true)}
      onClick={() => setWanted(true)}
      className="flex size-7 items-center justify-center rounded-full ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <span className="sr-only">{name}</span>
      <Avatar className="size-7">
        <AvatarImage src={user?.imageUrl} alt="" />
        <AvatarFallback className="text-xs">
          {name.trim().slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </button>
  )
}

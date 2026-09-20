"use client"

import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { useQuery } from "convex/react"
import { CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { useLocale } from "@/components/locale-provider"
import { STAFF } from "@/features/staff/strings/staff"
import { fmtDate } from "@/lib/format"
import { t } from "@/lib/i18n/locale"

/**
 * Hand an invitation over yourself, for when no email went out.
 *
 * **What is copied is a message, not a URL, and it must stay that way.** An
 * invitation carries no token — `staffInvitations` has an email and roles and
 * nothing else — so the grant binds to the *address*, and the console URL on
 * its own names no invitation. The email gets away with sending a bare link
 * because it arrives at the address it is talking about; a pasted link has lost
 * that, and the recipient cannot tell which of their addresses to sign in with.
 *
 * **A token must not be added to make this tidier.** The binding requires a
 * Clerk-*verified* address, which is what stops a forwarded invitation from
 * granting anything to whoever holds it.
 *
 * Written in the operator's console language, not the invited person's: the
 * `english` flag on `staff.invite` is used to pick the email's language and is
 * never stored, so by the time a row is being copied there is nothing to read.
 * The operator knows who they are writing to and can switch the console.
 *
 * With no console URL there is no link to give, so it says so rather than
 * offering a button — and rather than guessing from `window.location`, which on
 * a machine reaching the console over localhost or a staff-only origin would
 * copy an address the recipient cannot open.
 */
export function CopyInviteLink({
  email,
  expiresAt,
}: {
  email: string
  expiresAt: number
}) {
  const locale = useLocale()
  const labels = t(STAFF, locale)
  const link = useQuery(api.staff.inviteLink)

  if (link === undefined) return null

  if (link === null) {
    return (
      <span className="max-w-44 px-2 text-end text-xs text-muted-foreground">
        {labels.copyNoUrl}
      </span>
    )
  }

  const message = labels.inviteMessage
    .replace("{link}", link)
    .replace("{email}", email)
    .replace("{date}", fmtDate(expiresAt, locale))

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() =>
        void navigator.clipboard
          .writeText(message)
          .then(() =>
            toast.success(labels.inviteCopied.replace("{email}", email))
          )
      }
    >
      <CopyIcon className="size-3.5" aria-hidden />
      {labels.copyInvite}
    </Button>
  )
}

"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import { Button } from "@workspace/ui/components/button"
import { LogOutIcon, ShieldAlertIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * What a signed-in non-reviewer sees.
 *
 * It renders *instead of* the shell, not inside it, so none of the sidebar is
 * on screen — including its `UserButton`. That makes the sign-out button here
 * load-bearing rather than decorative: it is the only way off this screen. The
 * likeliest visitor is someone signed in with their owner account on a machine
 * where they also have a reviewer one, and the fix is to switch accounts.
 *
 * The email is shown for the same reason. "Not a reviewer account" is a much
 * more useful sentence when you can see *which* account it is talking about.
 */
export function NotAuthorised() {
  const labels = t(COMMON, useLocale())
  const { user } = useUser()
  const { signOut } = useClerk()

  const email = user?.primaryEmailAddress?.emailAddress

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-start gap-4 rounded-xl border bg-card p-6 text-card-foreground">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <ShieldAlertIcon className="size-5" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-lg font-semibold">
            {labels.notAuthorisedTitle}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {labels.notAuthorisedBody}
          </p>
        </div>

        {email !== undefined && (
          <p className="text-sm text-muted-foreground">
            {labels.signedInAs}{" "}
            {/* An address is a machine string: it stays LTR and unshaped even
                inside Arabic prose, or bidi reordering mangles it. */}
            <span
              dir="ltr"
              className="inline-block font-medium text-foreground"
            >
              {email}
            </span>
          </p>
        )}

        <div className="flex w-full flex-col gap-2 border-t pt-4">
          <p className="text-sm text-muted-foreground">{labels.signOutHint}</p>
          <Button
            variant="outline"
            className="self-start"
            onClick={() => void signOut()}
          >
            <LogOutIcon />
            {labels.signOut}
          </Button>
        </div>
      </div>
    </div>
  )
}

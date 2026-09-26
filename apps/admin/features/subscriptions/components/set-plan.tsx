"use client"

import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { useMutation } from "convex/react"
import { CalendarPlusIcon } from "lucide-react"
import { toast } from "sonner"

import { usePermissions } from "@/hooks/use-permissions"
import { ConfirmAction } from "@/components/confirm-action"
import { SUBSCRIPTIONS } from "@/features/subscriptions/strings/subscriptions"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * The console's billing write, and on the dev deployment the only way a paid
 * plan can exist at all.
 *
 * It sits on this screen rather than on the account page for the same reason
 * the identity reset sits on the identity queue: the account page reports and
 * does not act, and an action belongs where the rows it applies to are already
 * gathered.
 *
 * **Three actions, not one, because they are three different facts.** Expiring
 * leaves an annual plan whose date has passed — the lapsed state, where adding
 * stops and reading and executor delivery do not — while revoking removes the
 * plan outright. Collapsing them would leave the lapsed path unreachable from the
 * console and therefore untested, and it reads differently in the audit log.
 *
 * Neutral tone throughout: none of this is irreversible, and the dialog
 * reserves the destructive tone for things that are.
 */
export function SetPlan({
  userId,
  name,
  plan,
  locale,
}: {
  userId: Id<"users">
  name: string
  plan: "free" | "annual"
  locale: Locale
}) {
  const labels = t(SUBSCRIPTIONS, locale)
  const { has } = usePermissions()
  const setPlan = useMutation(api.billing.adminSetPlan)
  const paid = plan === "annual"

  async function run(
    args: { plan: "free" | "annual"; months?: number },
    done: string
  ) {
    try {
      await setPlan({ userId, ...args })
      toast.success(done)
    } catch (error) {
      toast.error(
        labels.toastFailed,
        error instanceof Error ? { description: error.message } : undefined
      )
    }
  }

  // Absent rather than disabled: a greyed-out control invites "why can't I?",
  // an absent one reads as "not my job". The refusal is in the mutation.
  if (!has("billing.manage")) return null

  return (
    <div className="flex items-center justify-end gap-1">
      <ConfirmAction
        tone="neutral"
        title={paid ? labels.extendTitle : labels.grantTitle}
        body={(paid ? labels.extendBody : labels.grantBody).replace(
          "{name}",
          name
        )}
        confirmLabel={paid ? labels.extend : labels.grant}
        cancelLabel={labels.cancel}
        trigger={
          <Button variant="outline" size="sm">
            <CalendarPlusIcon className="size-3.5" aria-hidden />
            {paid ? labels.extend : labels.grant}
          </Button>
        }
        onConfirm={() =>
          run({ plan: "annual", months: 12 }, labels.toastGranted)
        }
      />

      {/* Offered only where they would do something: there is nothing to
          expire or revoke on an account that has never had a plan. */}
      {paid && (
        <>
          <ConfirmAction
            tone="neutral"
            title={labels.expireTitle}
            body={labels.expireBody.replace("{name}", name)}
            confirmLabel={labels.expire}
            cancelLabel={labels.cancel}
            trigger={
              <Button variant="ghost" size="sm">
                {labels.expire}
              </Button>
            }
            onConfirm={() =>
              run({ plan: "annual", months: -1 }, labels.toastGranted)
            }
          />
          <ConfirmAction
            tone="neutral"
            title={labels.revokeTitle}
            body={labels.revokeBody.replace("{name}", name)}
            confirmLabel={labels.revoke}
            cancelLabel={labels.cancel}
            trigger={
              <Button variant="ghost" size="sm">
                {labels.revoke}
              </Button>
            }
            onConfirm={() => run({ plan: "free" }, labels.toastGranted)}
          />
        </>
      )}
    </div>
  )
}

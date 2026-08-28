"use client"

import { useState, type ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A confirm dialog that looks like what it does.
 *
 * Every admin action on a claim is confirmed, which carries a known cost:
 * identical dialogs everywhere train people to click through without reading,
 * and that is how the irreversible one eventually gets approved by reflex. The
 * mitigation is that `tone` makes the two non-interchangeable on sight —
 * different title, different body, different verb, and a destructive button that
 * does not look like the neutral one.
 *
 * `destructive` here means genuinely irreversible: nothing anywhere moves a
 * claim out of `locked`. Linking an heir is reversible until release, so it gets
 * the neutral treatment.
 *
 * ## Why the open state is controlled
 *
 * The action is async and can fail. Left uncontrolled, the dialog would dismiss
 * itself the instant the button is pressed, and a rejected mutation would report
 * into a component that had already unmounted — the operator would see the
 * dialog vanish and assume it worked. Here it stays open, and disabled, until
 * the promise settles, and only a success closes it.
 */
export function ConfirmAction({
  trigger,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "neutral",
  onConfirm,
}: {
  trigger: ReactNode
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  tone?: "neutral" | "destructive"
  onConfirm: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading">{title}</AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed">
            {body}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className={cn(
              tone === "destructive" &&
                buttonVariants({ variant: "destructive" })
            )}
            onClick={(event) => {
              event.preventDefault()
              void run()
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

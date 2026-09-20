"use client"

import { useState, type ReactNode } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { useLocale } from "@/components/locale-provider"
import { SheetBody, SheetShell } from "@/components/sheet-shell"
import { RolePicker } from "@/features/staff/components/role-picker"
import { STAFF } from "@/features/staff/strings/staff"
import { t } from "@/lib/i18n/locale"

/**
 * Which roles one person holds.
 *
 * Saving an empty set is not a mistake to guard against — it is how somebody is
 * taken off staff while their account and their audit history stay exactly
 * where they are. What they may do is derived from these, so there is nothing
 * else to tick.
 */
export function AssignRoles({
  userId,
  name,
  current,
  trigger,
}: {
  userId: Id<"users">
  name: string
  current: readonly Id<"staffRoles">[]
  trigger: ReactNode
}) {
  const locale = useLocale()
  const labels = t(STAFF, locale)
  const setRoles = useMutation(api.staff.setUserRoles)

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState<Id<"staffRoles">[]>([...current])

  async function save() {
    setBusy(true)
    try {
      await setRoles({ userId, roleIds: picked })
      toast.success(labels.assignSaved)
      setOpen(false)
    } catch (error) {
      // "This is the last Owner", "you cannot change your own access", "you
      // cannot grant a permission you do not hold" — every refusal here is a
      // sentence worth reading.
      toast.error(error instanceof Error ? error.message : labels.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SheetShell
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // Reseeded on open rather than at mount: the row behind this sheet is
        // live, and a second opening must not show the set it had before
        // somebody else changed it.
        if (next) setPicked([...current])
      }}
      trigger={trigger}
      title={labels.assignTitle.replace("{name}", name)}
      description={labels.assignBody}
      footer={
        <Button disabled={busy} onClick={() => void save()}>
          {busy ? labels.saving : labels.assignSave}
        </Button>
      }
    >
      <SheetBody>
        <RolePicker picked={picked} onChange={setPicked} />
      </SheetBody>
    </SheetShell>
  )
}

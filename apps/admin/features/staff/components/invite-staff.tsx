"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { useMutation } from "convex/react"
import { UserPlusIcon } from "lucide-react"
import { toast } from "sonner"

import { useLocale } from "@/components/locale-provider"
import { SheetBody, SheetField, SheetShell } from "@/components/sheet-shell"
import { RolePicker } from "@/features/staff/components/role-picker"
import { STAFF } from "@/features/staff/strings/staff"
import { t } from "@/lib/i18n/locale"

/**
 * Invite somebody to the console.
 *
 * Nothing is granted here, and the copy says so: the invitation binds only when
 * an account with that address signs in **and Clerk has verified the address**.
 * That check is the whole security of this flow — without it, typing a
 * colleague's address into a sign-up form would inherit whatever they were
 * invited to.
 *
 * The language switch is not decoration. The recipient has no account yet, so
 * there is no stored locale to read; the person sending the invitation is the
 * only one who knows which language to write in.
 */
export function InviteStaff() {
  const locale = useLocale()
  const labels = t(STAFF, locale)
  const invite = useMutation(api.staff.invite)

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState("")
  const [english, setEnglish] = useState(locale === "en")
  const [picked, setPicked] = useState<Id<"staffRoles">[]>([])

  async function send() {
    setBusy(true)
    try {
      const result = await invite({ email, roleIds: picked, english })
      toast.success(
        result.emailed ? labels.inviteSent : labels.inviteSavedNoMail
      )
      setOpen(false)
    } catch (error) {
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
        // Cleared on open, not after a success: a refusal leaves the sheet
        // holding what was typed, which is what the operator wants to correct.
        if (next) {
          setEmail("")
          setPicked([])
        }
      }}
      trigger={
        <Button size="sm">
          <UserPlusIcon className="size-3.5" aria-hidden />
          {labels.invite}
        </Button>
      }
      title={labels.inviteTitle}
      description={labels.inviteBody}
      footer={
        <Button
          disabled={busy || email.trim() === "" || picked.length === 0}
          onClick={() => void send()}
        >
          {busy ? labels.saving : labels.inviteSend}
        </Button>
      }
    >
      <SheetBody>
        <SheetField label={labels.inviteEmail}>
          <Input
            dir="ltr"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </SheetField>

        <RolePicker picked={picked} onChange={setPicked} />

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={english}
            onCheckedChange={(checked) => setEnglish(checked === true)}
          />
          {labels.inviteEnglish}
        </label>
      </SheetBody>
    </SheetShell>
  )
}

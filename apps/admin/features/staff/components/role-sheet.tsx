"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { ConfirmAction } from "@/components/confirm-action"
import { useLocale } from "@/components/locale-provider"
import {
  CheckboxList,
  CheckboxRow,
  SheetBody,
  SheetField,
  SheetShell,
} from "@/components/sheet-shell"
import { STAFF } from "@/features/staff/strings/staff"
import { t } from "@/lib/i18n/locale"
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
} from "@/lib/i18n/strings/permissions"

export type EditableRole = {
  id: Id<"staffRoles">
  name: { ar: string; en: string }
  description: { ar: string; en: string } | null
  permissions: readonly string[]
  holders: number
}

/**
 * Build a role out of permission keys.
 *
 * The checkboxes are the backend's catalogue, grouped the way the sidebar is
 * grouped — so an Owner ticking boxes is looking at the console they are
 * building for somebody else rather than at a list of identifiers.
 *
 * **Only keys the editor holds are shown.** The mutation refuses the rest
 * anyway (you cannot grant what you do not hold, which is what stands in for a
 * two-person rule), and offering a checkbox that always fails is worse than
 * not offering it. An Owner holds the wildcard, so they see everything.
 *
 * Controlled, and **the caller keys it by role id**: the fields seed from props
 * once, so one shared instance would open the second role showing the first
 * one's text.
 */
export function RoleSheet({
  role,
  open,
  onClose,
}: {
  /** `null` while creating, which is why `open` is separate from it. */
  role: EditableRole | null
  open: boolean
  onClose: () => void
}) {
  const locale = useLocale()
  const labels = t(STAFF, locale)
  const groups = t(PERMISSION_GROUPS, locale)
  const catalogue = useQuery(api.staff.catalogue)
  const create = useMutation(api.staff.createRole)
  const save = useMutation(api.staff.saveRole)
  const remove = useMutation(api.staff.deleteRole)

  const [busy, setBusy] = useState(false)
  const [nameAr, setNameAr] = useState(role?.name.ar ?? "")
  const [nameEn, setNameEn] = useState(role?.name.en ?? "")
  const [descAr, setDescAr] = useState(role?.description?.ar ?? "")
  const [descEn, setDescEn] = useState(role?.description?.en ?? "")
  const [keys, setKeys] = useState<string[]>([...(role?.permissions ?? [])])

  const byGroup = new Map<string, string[]>()
  for (const entry of catalogue ?? []) {
    byGroup.set(entry.group, [...(byGroup.get(entry.group) ?? []), entry.key])
  }

  function toggle(key: string, on: boolean) {
    setKeys((prev) =>
      on ? [...new Set([...prev, key])] : prev.filter((k) => k !== key)
    )
  }

  async function submit() {
    setBusy(true)
    try {
      const args = {
        name: { ar: nameAr.trim(), en: nameEn.trim() },
        description:
          descAr.trim() === "" && descEn.trim() === ""
            ? undefined
            : { ar: descAr.trim(), en: descEn.trim() },
        permissions: keys,
      }
      if (role === null) {
        await create(args)
        toast.success(labels.roleCreated)
      } else {
        await save({ roleId: role.id, ...args })
        toast.success(labels.roleSaved)
      }
      onClose()
    } catch (error) {
      // The mutation names the refusal — an unknown key, a permission the
      // editor does not hold, the Owner role — and those sentences are the
      // whole reason the rules live server-side.
      toast.error(error instanceof Error ? error.message : labels.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SheetShell
      open={open}
      onOpenChange={(next) => !next && onClose()}
      size="lg"
      title={role === null ? labels.roleNewTitle : labels.roleEditTitle}
      description={labels.roleEditBody}
      footer={
        <>
          {role !== null && (
            <ConfirmAction
              tone="destructive"
              title={labels.roleDeleteTitle}
              body={labels.roleDeleteBody}
              confirmLabel={labels.roleDelete}
              cancelLabel={labels.cancel}
              trigger={
                <Button
                  variant="ghost"
                  className="me-auto text-destructive"
                  disabled={role.holders > 0}
                >
                  {labels.roleDelete}
                </Button>
              }
              onConfirm={async () => {
                try {
                  await remove({ roleId: role.id })
                  toast.success(labels.roleDeleted)
                  onClose()
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : labels.failed
                  )
                }
              }}
            />
          )}
          <Button
            disabled={busy || nameAr.trim() === "" || nameEn.trim() === ""}
            onClick={() => void submit()}
          >
            {busy
              ? labels.saving
              : role === null
                ? labels.roleCreate
                : labels.roleSave}
          </Button>
        </>
      }
    >
      <SheetBody>
        <div className="grid gap-3 sm:grid-cols-2">
          <SheetField label={labels.roleNameAr}>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </SheetField>
          <SheetField label={labels.roleNameEn}>
            <Input
              dir="ltr"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
            />
          </SheetField>
          <SheetField label={labels.roleDescAr}>
            <Input value={descAr} onChange={(e) => setDescAr(e.target.value)} />
          </SheetField>
          <SheetField label={labels.roleDescEn}>
            <Input
              dir="ltr"
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
            />
          </SheetField>
        </div>

        {catalogue === undefined ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          [...byGroup.entries()].map(([group, groupKeys]) => (
            <section key={group} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {groups[group as keyof typeof groups] ?? group}
              </h3>
              <CheckboxList>
                {groupKeys.map((key) => (
                  <CheckboxRow
                    key={key}
                    control={
                      <Checkbox
                        checked={keys.includes(key)}
                        onCheckedChange={(checked) =>
                          toggle(key, checked === true)
                        }
                      />
                    }
                    title={PERMISSION_LABELS[key]?.[locale] ?? key}
                    subtitle={key}
                    subtitleDir="ltr"
                  />
                ))}
              </CheckboxList>
            </section>
          ))
        )}
      </SheetBody>
    </SheetShell>
  )
}

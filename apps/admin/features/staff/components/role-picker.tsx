"use client"

import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useQuery } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { CheckboxList, CheckboxRow } from "@/components/sheet-shell"
import { STAFF } from "@/features/staff/strings/staff"
import { t } from "@/lib/i18n/locale"

/**
 * Pick roles for somebody.
 *
 * Shared by the invitation and the assignment sheets, which asked the same
 * question with the same markup in two places — and, being two places, had
 * already drifted. What each role is worth is shown beside it, because an
 * operator choosing between "Reviewer" and "Support" should not have to open
 * the roles screen to find out which is which.
 */
export function RolePicker({
  picked,
  onChange,
}: {
  picked: Id<"staffRoles">[]
  onChange: (next: Id<"staffRoles">[]) => void
}) {
  const locale = useLocale()
  const labels = t(STAFF, locale)
  const roles = useQuery(api.staff.roles)

  if (roles === undefined) {
    return <Skeleton className="h-40 w-full rounded-lg" />
  }

  return (
    <CheckboxList>
      {roles.map((role) => (
        <CheckboxRow
          key={role.id}
          control={
            <Checkbox
              checked={picked.includes(role.id)}
              onCheckedChange={(checked) =>
                onChange(
                  checked === true
                    ? [...new Set([...picked, role.id])]
                    : picked.filter((id) => id !== role.id)
                )
              }
            />
          }
          title={role.name[locale]}
          subtitle={
            role.system
              ? labels.roleAll
              : (role.description?.[locale] ??
                labels.rolePermissions.replace(
                  "{count}",
                  String(role.permissions.length)
                ))
          }
        />
      ))}
    </CheckboxList>
  )
}

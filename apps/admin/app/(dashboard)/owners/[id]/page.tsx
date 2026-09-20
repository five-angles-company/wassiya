import { RequirePermission } from "@/components/permission-gate"
import { OwnerDetail } from "@/features/owners/components/owner-detail"

/** One account. Thin, like every route here — the id is all it forwards. */
export default async function OwnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <RequirePermission need="owners.read">
      <OwnerDetail userId={id} />
    </RequirePermission>
  )
}

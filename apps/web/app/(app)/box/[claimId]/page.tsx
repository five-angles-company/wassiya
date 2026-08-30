import { HeirBox } from "@/features/box/components/heir-box"

/**
 * The box, and the gate in front of it.
 *
 * No page header: the gate is the screen, and its own heading is the argument
 * the whole design rests on. Wrapping it in generic chrome would demote it to a
 * form.
 */
export default async function BoxPage({
  params,
}: {
  params: Promise<{ claimId: string }>
}) {
  const { claimId } = await params
  return <HeirBox claimId={claimId} />
}

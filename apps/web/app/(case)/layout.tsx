import { PageColumn } from "@/components/page-column"

/**
 * The public screens: a report's case page, an executor's link and delivery, the
 * report form, and help. No sign-in is required to reach them; each screen asks
 * for one itself when an action needs it.
 */
export default function CaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PageColumn>{children}</PageColumn>
}

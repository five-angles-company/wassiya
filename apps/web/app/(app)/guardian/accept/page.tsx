import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { AcceptFlow } from "@/features/guardian/components/accept-flow"
import { GUARDIAN } from "@/features/guardian/strings/guardian"

/**
 * The invitation.
 *
 * ## The owner is not named, and that is deliberate
 *
 * Naming them would need a public query keyed on the invite token, which is a
 * lookup oracle for anyone guessing tokens. The invitation email carries the
 * name; this page does not need it to explain the role, so it says "someone".
 *
 * `searchParams` is a promise in Next 16. A missing token is a truncated link,
 * which is common enough for forwarded email that it gets its own sentence
 * rather than a 404.
 */
export default async function GuardianAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const labels = t(GUARDIAN, await getLocale())

  if (token === undefined || token.length === 0) {
    return (
      <div className="border-border rounded-card max-w-[62ch] border p-6">
        <p className="text-[15px] leading-[1.75]">{labels.noToken}</p>
      </div>
    )
  }

  return <AcceptFlow token={token} ownerName={labels.someone} />
}

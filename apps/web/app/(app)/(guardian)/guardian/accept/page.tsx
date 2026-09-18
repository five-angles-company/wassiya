import { SetApart } from "@/components/doc/set-apart"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { AcceptFlow } from "@/features/guardian/components/accept-flow"
import { TokenEntry } from "@/features/guardian/components/token-entry"
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
 * `searchParams` is a promise in Next 16. A missing token is a truncated link —
 * and that is the **ordinary** case, not an exotic one: the owner sends this
 * invitation by hand from their phone, over whatever channel they trust, and a
 * 64-character URL does not survive all of them.
 *
 * So it gets a way through rather than only a sentence. This page used to tell
 * somebody to "open the full link from your invitation" while they were looking
 * at the only link they had — a dead end for the one reader the page exists
 * for. The invitation carries the bare code beneath the link for exactly this
 * moment, and `TokenEntry` is where it goes.
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
      <SetApart className="flex flex-col gap-5">
        <p className="max-w-[66ch] text-[15px] leading-[1.75]">
          {labels.noToken}
        </p>
        <TokenEntry
          label={labels.tokenLabel}
          hint={labels.tokenHint}
          action={labels.tokenAction}
        />
      </SetApart>
    )
  }

  return <AcceptFlow token={token} ownerName={labels.someone} />
}

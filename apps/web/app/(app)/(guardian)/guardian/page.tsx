import { redirect } from "next/navigation"

/**
 * 🚨 **A redirect, and it must stay reachable — the guardian's email points
 * here.**
 *
 * `GUARDIAN_CLAIM_COPY`'s link is `/guardian`, **never** `/guardian/<claimId>`,
 * and `emailCopy.ts` gives the reason: *"a claim id is a capability that names
 * the deceased"*, and an email is the least controlled surface this product
 * touches. The indirection is the point — the guardian is told only that
 * something is waiting and where to go, and the id is never put in an inbox.
 *
 * ⚠️ **This page was deleted outright and that broke the link.** Its content —
 * the guardian's standing state — moved to `/`, which was right: it was reached
 * from one redirect, on the row of `case-router`'s table where a guardian has
 * nothing to do, so the page existed only for readers with nothing waiting.
 * What the deletion missed is that the *route* has a second caller, in the
 * backend, that no front-end search would have found.
 *
 * So the route stays and the page does not. `/` answers this reader properly:
 * with a duty waiting it forwards to `/guardian/<claimId>`, and with none it
 * renders `GuardianStanding` — which is exactly what used to be here.
 *
 * ⚠️ **A server redirect, so nothing lands in the back stack** — which is what
 * `case-router` takes care over for `/` itself, and matters doubly here because
 * this doorway leads to another one.
 */
export default function GuardianIndexPage() {
  redirect("/")
}

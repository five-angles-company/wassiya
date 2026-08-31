import { DutiesList } from "@/features/guardian/components/duties-list"
import { GuardianHero } from "@/features/guardian/components/guardian-hero"

/**
 * The guardian's screen.
 *
 * No `PageHeader`: this one gets a hero of its own, because the two figures it
 * carries — vaults guarded, things waiting — answer the question the reader
 * arrived with, and a shared title block cannot hold a number that comes from a
 * subscription.
 */
export default function GuardianPage() {
  return (
    <>
      <GuardianHero />
      <DutiesList />
    </>
  )
}

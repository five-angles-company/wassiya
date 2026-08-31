import { DutiesList } from "@/features/guardian/components/duties-list"

/**
 * The guardian's screen.
 *
 * Thin, like every other route: the header depends on nothing the server has,
 * and the screen's own component owns it — same as `/claims`. It briefly had a
 * hero card with its own stat treatment, which is how it drifted from the home
 * screen it sits one click from.
 */
export default function GuardianPage() {
  return <DutiesList />
}

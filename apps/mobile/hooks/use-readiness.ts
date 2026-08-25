/**
 * The one question Home exists to answer.
 *
 * > لو حدث لكِ شيء اليوم، هل تصل خزنتك إلى ورثتك؟
 * > *If something happened to you today, would your vault reach your heirs?*
 *
 * The app used to answer that with a ring and "4/5". A percentage is the wrong
 * shape for the question: 4/5 doesn't say whether the missing fifth is a
 * cosmetic nicety or the reason nothing will ever be delivered. Those are the
 * only two things a reader actually wants to know.
 *
 * ## Three answers, not two
 *
 * A binary yes/no would be a lie in one direction. The seven protection items
 * fail in two genuinely different ways:
 *
 *  - **Delivery blockers** — no heirs, nothing routed, or no life check-in.
 *    With any of these the vault reaches nobody. *No check-in belongs here and
 *    the placement is the whole point:* delivery is triggered by the dead man's
 *    switch, so a vault with heirs, routing and no switch is a vault that
 *    waits forever. It looks 6/7 complete and delivers nothing.
 *  - **Access risks** — no printed sheet, or no guardian. Heirs are unaffected;
 *    the person who could be locked out is *the owner*. Telling someone their
 *    family is at risk when the real exposure is to themselves would be both
 *    wrong and frightening.
 *
 * Identity and key are prerequisites rather than gaps — you cannot reach a
 * vault screen without them — so they fall into `blocked` for completeness and
 * should never actually surface.
 *
 * ## Reuse, not a second opinion
 *
 * Everything here derives from {@link useProtectionScore}, whose own header
 * warns that two independent computations of "how safe is this vault" will
 * eventually disagree — the one thing a security summary may never do. This
 * hook re-reads that model and classifies it; it never re-derives it.
 */
import { useMemo } from "react"

import {
  useProtectionScore,
  type ProtectionEntry,
  type ProtectionId,
} from "@/hooks/use-protection-score"

/** Gaps that mean the vault reaches nobody. */
const BLOCKS_DELIVERY = new Set<ProtectionId>([
  "identity",
  "key",
  "heirs",
  "routing",
  "checkin",
])

export type Readiness =
  | { kind: "loading" }
  /** Everything delivery needs is in place. */
  | { kind: "ready"; heirCount: number }
  /** Nothing would be delivered. `gap` is the highest-ranked reason. */
  | { kind: "blocked"; gap: ProtectionEntry }
  /** Heirs are covered; the owner's own access is what's exposed. */
  | { kind: "atRisk"; gap: ProtectionEntry }

export type ReadinessResult = {
  verdict: Readiness
  /** Passed through so a caller can still show the underlying items. */
  items: ProtectionEntry[]
  heirCount: number
}

export function useReadiness(
  labels: Record<ProtectionId, string>,
  heirCount: number
): ReadinessResult {
  const { items, loading } = useProtectionScore(labels)

  const verdict = useMemo((): Readiness => {
    if (loading) return { kind: "loading" }

    const open = items.filter((item) => !item.done)
    if (open.length === 0) return { kind: "ready", heirCount }

    // Delivery failures outrank access risks regardless of list order: "your
    // family gets nothing" must never queue behind "reprint your sheet".
    const blocking = open.find((item) => BLOCKS_DELIVERY.has(item.id))
    return blocking !== undefined
      ? { kind: "blocked", gap: blocking }
      : { kind: "atRisk", gap: open[0]! }
  }, [items, loading, heirCount])

  return { verdict, items, heirCount }
}

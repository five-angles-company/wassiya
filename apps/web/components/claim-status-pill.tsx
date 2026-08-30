import { t, type Locale } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * A claim's state, in one pill.
 *
 * Shared rather than owned by `features/claims`, because three features render
 * it — the reports list, the box index and the guardian's duty rows — and the
 * one thing worse than a shared primitive is the same six states spelled three
 * ways.
 *
 * ## Three tones and no red
 *
 * Olive is settled (released), terracotta is *now* (the objection period,
 * awaiting the guardian), sand is neither. `vetoed` and `locked` take the sand
 * tone deliberately: they are closed states, not failures, and a red badge on
 * the screen of someone who has just learned their report was objected to would
 * be the app shouting at the wrong person. The Organic palette has no red at
 * all — see the theme's own note.
 */
const TONE: Record<string, "settled" | "now" | "quiet"> = {
  released: "settled",
  awaiting_veto: "now",
  guardian_review: "now",
  submitted: "quiet",
  vetoed: "quiet",
  locked: "quiet",
}

const LABEL: Record<string, keyof typeof COMMON> = {
  submitted: "statusSubmitted",
  awaiting_veto: "statusAwaitingVeto",
  guardian_review: "statusGuardianReview",
  released: "statusReleased",
  vetoed: "statusVetoed",
  locked: "statusLocked",
}

export function ClaimStatusPill({
  status,
  locale,
}: {
  status: string
  locale: Locale
}) {
  const labels = t(COMMON, locale)
  const key = LABEL[status]
  const tone = TONE[status] ?? "quiet"

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[12.5px] font-semibold ${
        tone === "settled"
          ? "bg-secondary text-secondary-foreground"
          : tone === "now"
            ? "bg-accent text-accent-foreground"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {/* An unmapped status is a backend that grew a state this app has not
          learned yet. Showing the raw token beats showing nothing: it is
          diagnosable from a screenshot. */}
      {key === undefined ? status : labels[key]}
    </span>
  )
}

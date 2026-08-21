// Scheduled sweeps.
//
// Both jobs are idempotent and cursor-batched: each pass advances whatever is
// due, and self-schedules a continuation when it fills a batch. A missed run is
// therefore never lost work — the next pass simply finds more to do.
import { cronJobs } from "convex/server"

import { internal } from "./_generated/api"

const crons = cronJobs()

// Escalate overdue life check-ins (day 0 → 7 → 14 → countdown) and write the
// notification each step calls for. Hourly is well inside the day granularity
// the escalation steps are expressed in.
crons.interval(
  "advance check-in escalation",
  { hours: 1 },
  internal.checkin.sweep,
  {}
)

// Release claims whose veto window has run out with no veto. This is the one
// transition in the product that happens without a human, so it runs often
// enough that "the deadline passed" and "it released" are close together.
crons.interval(
  "advance death claims",
  { hours: 1 },
  internal.claims.advance,
  {}
)

export default crons

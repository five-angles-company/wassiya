// Convex components mounted into this app.
//
// `resend` backs the one thing this deployment sends to a human: the check-in
// escalation notice. It is a component rather than a bare `fetch` because a
// dropped escalation email is a safety failure, not a missed newsletter — the
// component queues durably, retries through provider outages, and manages
// Resend's idempotency keys so a retry cannot double-send.
import { defineApp } from "convex/server"
import resend from "@convex-dev/resend/convex.config.js"

const app = defineApp()
app.use(resend)

export default app

import { cn } from "@workspace/ui/lib/utils"

/** The shape both `auditLog.meta` and `notifications.payload` use. */
type ScalarRecord = Record<string, string | number | boolean | null>

/**
 * A `scalarRecord` shown as its own key-value pairs.
 *
 * Shared by both Records screens because both tables carry one: the audit log's
 * `meta` and a notification's `payload` are the same schema type, written by us
 * rather than typed by anyone.
 *
 * **Shown whole, and that is a deliberate reading of what is in it.** Every
 * writer keeps third-party personal data out — `claim.certificate_attached`
 * records the claim id, not the name on the certificate; the escalation ladder
 * records `daysOverdue`, not what the message said. What is left is ids and
 * small facts, so there is nothing here to redact.
 *
 * Raw and LTR, like the event name beside it: this is the record, and an
 * operator comparing the console against the deployment needs the two to read
 * as the same string. Nulls are dropped — a key whose value is null is a field
 * the writer had nothing to put in.
 */
export function ScalarMeta({
  data,
  className,
}: {
  data: ScalarRecord
  className?: string
}) {
  const entries = Object.entries(data).filter(([, value]) => value !== null)

  if (entries.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span
      dir="ltr"
      className={cn("inline-flex flex-wrap gap-x-3 gap-y-0.5", className)}
    >
      {entries.map(([key, value]) => (
        <span key={key} className="font-mono text-xs whitespace-nowrap">
          <span className="text-muted-foreground">{key}=</span>
          {String(value)}
        </span>
      ))}
    </span>
  )
}

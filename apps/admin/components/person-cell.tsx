import Link from "next/link"

/**
 * A person in a table cell: name over email, linked to their account.
 *
 * Both name and email are nullable on purpose. Every row in the Records group
 * joins its `userId` back to `users`, and a row whose subject no longer exists
 * is exactly the case an append-only log has to survive — the log keeps the
 * event, the user table may not keep the user. Falling back to the id keeps the
 * row readable and keeps the link working, which is more than a blank cell.
 */
export function PersonCell({
  id,
  name,
  email,
}: {
  id: string
  name: string | null
  email: string | null
}) {
  return (
    <Link href={`/owners/${id}`} className="flex flex-col hover:underline">
      {name ? (
        <span className="font-medium">{name}</span>
      ) : (
        <span dir="ltr" className="inline-block font-mono text-xs">
          {id}
        </span>
      )}
      {email && (
        <span dir="ltr" className="inline-block text-xs text-muted-foreground">
          {email}
        </span>
      )}
    </Link>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/button"
import { TextInput } from "@/components/text-input"

/**
 * The way into an invitation whose link arrived broken.
 *
 * ## Why this exists at all
 *
 * The owner sends a guardian invitation **by hand**, from their phone, over
 * whatever channel they trust — and a 64-character URL does not survive all of
 * them. Before this, `/guardian/accept` read the token only from `?token=`, so
 * a mangled or forwarded link left the invited person on a page that told them
 * to open a link they were already looking at. The invitation message itself
 * carries the bare code underneath the link for exactly this moment.
 *
 * ## It accepts the whole link, not only the code
 *
 * People paste what they were sent. Pulling the token out of a URL is three
 * lines here and saves a reader from being told their paste is wrong when it
 * contains precisely what is needed.
 *
 * Navigating to `?token=…` rather than validating here keeps one entry point:
 * the page still does its own checking, and a code typed in is indistinguishable
 * from one that arrived in the address bar.
 */
export function TokenEntry({
  label,
  hint,
  action,
}: {
  label: string
  hint: string
  action: string
}) {
  const router = useRouter()
  const [value, setValue] = useState("")

  const token = extractToken(value)

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (token === null) return
        router.push(`/guardian/accept?token=${encodeURIComponent(token)}`)
      }}
    >
      <label className="text-[13.5px] font-semibold" htmlFor="invite-token">
        {label}
      </label>
      <TextInput
        id="invite-token"
        mono
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="…"
        action={
          <Button type="submit" size="sm" disabled={token === null}>
            {action}
          </Button>
        }
      />
      <p className="text-muted-foreground text-[13px]">{hint}</p>
    </form>
  )
}

/** The code, from either a bare token or the whole link it was sent in. */
function extractToken(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return null

  const marker = "token="
  const at = trimmed.indexOf(marker)
  const candidate =
    at === -1
      ? trimmed
      : (trimmed.slice(at + marker.length).split(/[&#\s]/)[0] ?? "")

  const token = decodeURIComponent(candidate).trim()
  return token.length === 0 ? null : token
}

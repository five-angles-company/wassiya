"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { guardianKeyMatches } from "@workspace/crypto/guardianKey"
import { useQuery } from "convex/react"
import { KeyRoundIcon } from "lucide-react"

import { Button } from "@/components/button"
import { EmptyState } from "@/components/empty-state"
import { Panel } from "@/components/panel"
import { Section } from "@/components/section"
import { DeviceKeyPanel } from "@/features/guardian/components/device-key-panel"
import { TextInput } from "@/components/text-input"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

type Verdict = "unchecked" | "ok" | "bad"

/**
 * The guardian's key sheet: what it is, and whether the one they hold still
 * works.
 *
 * ## The check this page exists for
 *
 * A guardian is asked to produce a printed code at one ceremony, possibly years
 * after they filed it away. Until now there was no way to find out whether the
 * sheet in the drawer was the right one *before* that day — and the day it
 * fails is the day it cannot be fixed. `guardians.guardianFor` returns the
 * published **public** key, so this page can compare locally and say yes or no.
 *
 * The comparison runs in the browser. The typed secret is never sent anywhere,
 * and `guardianKeyMatches` derives the public half and compares that.
 *
 * ## Why "it doesn't match" leads with transcription
 *
 * The code drops the ambiguous glyphs (0/O, 1/I) for exactly this reason, and a
 * mis-read character is still far commoner than a lost sheet. Telling someone
 * their key is gone when they have simply typed a letter wrong turns a
 * two-minute correction into a re-appointment.
 */
export function GuardianKey() {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)
  const vaults = useQuery(api.guardians.guardianFor, {})
  const [typed, setTyped] = useState("")
  const [verdict, setVerdict] = useState<Verdict>("unchecked")

  if (vaults === undefined) {
    return <div className="bg-card rounded-card h-40 animate-pulse" aria-hidden />
  }
  if (vaults.length === 0) {
    return (
      <EmptyState
        icon={KeyRoundIcon}
        title={labels.keyTitle}
        body={labels.vaultsEmpty}
      />
    )
  }

  // Every guardianship this person holds was accepted from the same device with
  // its own minted sheet, so a code that matches any of them is a good sheet.
  // Reporting per-vault would ask the reader to know which sheet is which, and
  // nothing on the paper says.
  const published = vaults
    .map((vault) => vault.x25519PublicKey)
    .filter((key): key is ArrayBuffer => key !== null)

  function check() {
    if (published.length === 0) {
      setVerdict("bad")
      return
    }
    setVerdict(
      published.some((key) => guardianKeyMatches(typed, new Uint8Array(key)))
        ? "ok"
        : "bad"
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* First, because for a guardian who accepted here it answers both
          questions outright — is this still the key, and can I have the sheet
          back — without the typed check underneath being needed at all. */}
      <DeviceKeyPanel published={published.map((key) => new Uint8Array(key))} />

      <Panel icon={KeyRoundIcon} title={labels.keyTitle}>
        <p className="max-w-[62ch] text-[14.5px] leading-[1.75]">
          {labels.keyBody}
        </p>
        <ul className="mt-4 flex flex-col gap-1.5">
          {vaults.map((vault) => (
            <li key={vault.guardianId} className="text-[14px] font-semibold">
              {labels.keyForVault.replace("{name}", vault.subjectName ?? "—")}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title={labels.keyCheckTitle}>
        <p className="text-muted-foreground max-w-[62ch] text-[14px] leading-[1.7]">
          {labels.keyCheckBody}
        </p>

        {published.length === 0 ? (
          <p className="mt-4 text-[14px] leading-[1.7]">{labels.keyNoPublished}</p>
        ) : (
          <>
            <TextInput
              mono
              value={typed}
              onChange={(event) => {
                setTyped(event.target.value)
                setVerdict("unchecked")
              }}
              placeholder="WSYG1-…"
              invalid={verdict === "bad"}
              className="mt-4 max-w-[560px]"
            />
            <Button
              variant="secondary"
              className="mt-4"
              onClick={check}
              disabled={typed.trim().length === 0}
            >
              {labels.keyCheckAction}
            </Button>

            {verdict === "ok" && (
              <p className="bg-olive-100 text-olive-700 rounded-card mt-4 max-w-[62ch] p-4 text-[14px] leading-[1.7]">
                {labels.keyCheckOk}
              </p>
            )}
            {verdict === "bad" && (
              <p className="text-terracotta-800 mt-4 max-w-[62ch] text-[14px] leading-[1.7]">
                {labels.keyCheckBad}
              </p>
            )}
          </>
        )}
      </Panel>

      <Section title={labels.keyLostTitle}>
        <p className="text-muted-foreground max-w-[62ch] text-[14px] leading-[1.7]">
          {labels.keyLostBody}
        </p>
      </Section>
    </div>
  )
}

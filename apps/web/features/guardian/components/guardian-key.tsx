"use client"

import { useState, useSyncExternalStore } from "react"
import { api } from "@workspace/backend/api"
import { guardianPublicKey } from "@workspace/crypto/guardian"
import {
  decodeGuardianKey,
  encodeGuardianKey,
  guardianKeyMatches,
  type GuardianKeySheet,
} from "@workspace/crypto/guardianKey"
import { useQuery } from "convex/react"

import { Button } from "@/components/button"
import { EmptyState } from "@/components/empty-state"
import { Paper } from "@/components/doc/paper"
import { Prose } from "@/components/doc/prose"
import { DocSection } from "@/components/doc/section"
import { StatusLine } from "@/components/doc/status-line"
import { DocTitle } from "@/components/doc/title"
import { DeviceKeyPanel } from "@/features/guardian/components/device-key-panel"
import { KeepOnDevice } from "@/features/guardian/components/keep-on-device"
import { TextInput } from "@/components/text-input"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import {
  deviceKeyHeldServerSnapshot,
  deviceKeyHeldSnapshot,
  subscribeDeviceKey,
} from "@/features/guardian/lib/device-key"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

type Verdict = "unchecked" | "ok" | "bad"

/**
 * The guardian's key sheet: what it is, and whether the one they hold still
 * works.
 *
 * A guardian is asked to produce a printed code at one ceremony, possibly years
 * later — and the day it fails is the day it cannot be fixed. So
 * `guardians.guardianFor` returns the published **public** key and this page
 * compares locally. The typed secret is never sent anywhere;
 * `guardianKeyMatches` derives the public half and compares that.
 *
 * "It doesn't match" leads with transcription, because the code drops the
 * ambiguous glyphs (0/O, 1/I) for exactly this reason and a mis-read character
 * is still far commoner than a lost sheet. Telling someone their key is gone
 * when they typed a letter wrong turns a two-minute correction into a
 * re-appointment.
 *
 * ## ⚠️ A good sheet can be sealed to **this** device, not only the first one
 *
 * `KeepOnDevice` was rendered from exactly one place — `accept-done`, with the
 * freshly minted sheet still in memory. One device, one chance, ever. A guardian
 * who declined, whose browser had no PRF that day, or who simply bought a new
 * phone had no road back to a sealed copy **while holding their paper**, which
 * is absurd: the paper is the authority and they were being made to prove it
 * again by hand at every ceremony.
 *
 * So the offer follows a successful check. It grants nobody anything — the
 * reader has just demonstrated the secret, on this device, and the sheet in
 * their hand always let them do this. The gate is the same one `accept-done`
 * uses: the authenticator's own user verification.
 *
 * ⚠️ **`offerDeviceCopy` is latched at check time rather than read live.**
 * Saving flips `held`, which unmounts a live-gated offer the instant it
 * succeeds — the confirmation would vanish as the reader read it, and
 * `DeviceKeyPanel` would appear at the top of the page with nothing to connect
 * the two.
 *
 * ## ⚠️ The order is the hierarchy, and it was wrong
 *
 * The page opened on four `DocSection`s of equal weight with no `DocTitle` above
 * them, so it began mid-document with a hairline — and the tallest thing on it
 * was a bare list of every vault, above the check somebody came to run. A
 * guardian with sixteen guardianships got sixteen lines of "خزنة {name}" before
 * anything they could act on.
 *
 * So: the page's own heading and the provenance paragraph go on the bare ground
 * (`DocTitle` + `Prose`) because they are the letter, not an attachment. The
 * coverage list is data, so it sits on `Paper` — its docstring names *"a list of
 * vaults"* as the example — and it goes **last**, under a heading that says what
 * it is for. Nothing above it is pushed down by a reader who guards twenty
 * vaults.
 *
 * ⚠️ **It does not page, where `VaultsPanel` does.** That panel shares `/` with
 * a duty card it must not bury; this list is at the foot of its own page and
 * `guardianFor` has already read every row to check the sheet against. Adding
 * `guardianForPage` here would be a second subscription for rows we hold.
 */
export function GuardianKey() {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)
  const vaults = useQuery(api.guardians.guardianFor, {})
  const [typed, setTyped] = useState("")
  const [verdict, setVerdict] = useState<Verdict>("unchecked")
  // The demonstrated sheet, rebuilt from what was typed so the copy can be
  // sealed without asking for it a second time. Zeroed the moment the field
  // changes under it.
  const [sheet, setSheet] = useState<GuardianKeySheet | null>(null)
  // Latched when the check passes — see the docstring. Live `held` would pull
  // the offer out from under its own success message.
  const [offerDeviceCopy, setOfferDeviceCopy] = useState(false)

  const held = useSyncExternalStore(
    subscribeDeviceKey,
    deviceKeyHeldSnapshot,
    deviceKeyHeldServerSnapshot
  )

  if (vaults === undefined) {
    return (
      <div className="border-border h-40 animate-pulse border-t" aria-hidden />
    )
  }
  if (vaults.length === 0) {
    return (
      <EmptyState
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

  /** Drop the demonstrated secret. Called wherever the typed value stops
   * standing for it — a changed character, or a fresh check. */
  function dropSheet() {
    if (sheet !== null) {
      sheet.secretKey.fill(0)
      setSheet(null)
    }
  }

  function check() {
    dropSheet()
    if (published.length === 0) {
      setVerdict("bad")
      setOfferDeviceCopy(false)
      return
    }

    const matched = published.some((key) =>
      guardianKeyMatches(typed, new Uint8Array(key))
    )
    setVerdict(matched ? "ok" : "bad")
    setOfferDeviceCopy(matched && !held)
    if (!matched) return

    // `guardianKeyMatches` returning true means the code decoded, so this
    // cannot throw — but a decode is cheap and a thrown error here would blank
    // the page for somebody whose key is *fine*.
    try {
      const { secretKey, version } = decodeGuardianKey(typed)
      setSheet({
        secretKey,
        publicKey: guardianPublicKey(secretKey),
        // Re-encoded rather than kept as typed: `code` is documented as what
        // goes on the sheet, and spacing or case the reader added is not that.
        code: encodeGuardianKey(secretKey, version),
        version,
      })
    } catch {
      setOfferDeviceCopy(false)
    }
  }

  return (
    <div className="flex flex-col gap-11">
      <div className="flex flex-col gap-4">
        <DocTitle title={labels.keyTitle} />

        {/* The answer first. A guardian opens this to learn one thing — will I
            be able to do this when I am asked — and until now the page made
            them read three sections and run a check to find out. `held` is the
            durable half of that answer; the typed check below is the other. */}
        <StatusLine tone={held ? "settled" : "attention"}>
          {held ? labels.keyHeldLine : labels.keyPaperOnlyLine}
        </StatusLine>

        <Prose>
          <p>{labels.keyBody}</p>
        </Prose>
      </div>

      {/* First among the sections, because for a guardian who accepted here it
          answers both questions outright — is this still the key, and can I have
          the sheet back — without the typed check underneath being needed at
          all. It renders nothing at all on any other device. */}
      <DeviceKeyPanel published={published.map((key) => new Uint8Array(key))} />

      <DocSection title={labels.keyCheckTitle}>
        <p className="text-muted-foreground max-w-[66ch] text-[14.5px] leading-[1.7]">
          {labels.keyCheckBody}
        </p>

        {published.length === 0 ? (
          <p className="text-[14.5px] leading-[1.7]">{labels.keyNoPublished}</p>
        ) : (
          <>
            <label
              className="text-[13.5px] font-semibold"
              htmlFor="guardian-key-code"
            >
              {labels.keyCheckLabel}
            </label>

            {/* A form, so Return checks: this is a code copied off paper, often
                on a phone with the keyboard covering whatever sits below the
                field. The button rides inside the field rather than beside it —
                see `text-input.tsx` for why that is one control and not two. */}
            <form
              className="-mt-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (typed.trim().length > 0) check()
              }}
            >
              <TextInput
                id="guardian-key-code"
                mono
                value={typed}
                onChange={(event) => {
                  setTyped(event.target.value)
                  setVerdict("unchecked")
                  setOfferDeviceCopy(false)
                  dropSheet()
                }}
                placeholder="WSYG1-…"
                invalid={verdict === "bad"}
                action={
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={typed.trim().length === 0}
                  >
                    {labels.keyCheckAction}
                  </Button>
                }
              />
            </form>

            {verdict === "ok" && (
              <>
                <p className="text-tone-settled max-w-[66ch] text-[14.5px] leading-[1.7] font-semibold">
                  {labels.keyCheckOk}
                </p>

                {/* The sheet just proved itself on this device. Offering to
                    keep it here is the same offer made on the day they
                    accepted, to the same person, behind the same
                    authenticator — and it renders nothing on a browser that
                    cannot do it. */}
                {offerDeviceCopy && sheet !== null && (
                  <KeepOnDevice sheet={sheet} />
                )}
              </>
            )}
            {verdict === "bad" && (
              <p className="text-tone-attention max-w-[66ch] text-[14.5px] leading-[1.7] font-semibold">
                {labels.keyCheckBad}
              </p>
            )}
          </>
        )}
      </DocSection>

      {/* Coverage, not inventory. One key was minted on the day this person
          accepted and every guardianship since was accepted from the same
          device, so the sheet in the drawer opens all of them — which is why the
          check above reports one verdict rather than one per vault. The same
          rows as `VaultsPanel`, deliberately: it is the same list, and a reader
          who saw it on `/` should recognise it here. */}
      <DocSection title={labels.keyOpensTitle}>
        <Paper>
          <dl className="divide-border divide-y">
            {vaults.map((vault) => (
              <div
                key={vault.guardianId}
                className="flex items-baseline justify-between gap-4 px-5 py-3.5"
              >
                <dt className="truncate text-[15px] font-semibold">
                  {vault.subjectName ?? "—"}
                </dt>
                <dd className="text-muted-foreground shrink-0 text-[13px]">
                  {vault.relation}
                </dd>
              </div>
            ))}
          </dl>
        </Paper>
      </DocSection>

      {/* A contingency, sized like one. It was a full section, which gave "what
          to do if it is gone" the same weight as the check that tells you
          whether it is. */}
      <p className="text-muted-foreground border-border max-w-[66ch] border-t pt-6 text-[13.5px] leading-[1.7]">
        <span className="text-foreground font-semibold">
          {labels.keyLostTitle}
        </span>{" "}
        — {labels.keyLostBody}
      </p>
    </div>
  )
}

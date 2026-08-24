"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"

import { ClaimStepper } from "@/components/claim/claim-stepper"
import { Field } from "@/components/claim/field"
import { CLAIM_CERTIFICATE } from "@/lib/claim-copy"
import { shortRef } from "@/lib/claim-ref"

const MAX_BYTES = 20 * 1024 * 1024
const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/heic"]

/**
 * ٧.٣ — the death certificate.
 *
 * ## Drag-and-drop is the web's actual advantage here
 *
 * *"a real file picker is the web's advantage since most families already have
 * a scan."* Not a novelty: the certificate usually arrives as a PDF in a
 * WhatsApp thread or an email, already on the laptop. The phone-camera path
 * exists for the families who only have paper, and the desktop path exists so
 * the rest are not forced through a camera they do not need.
 *
 * ## A name mismatch is never a rejection
 *
 * The board is emphatic: matching is *"fuzzy on transliteration, strict on
 * identity, and a mismatch routes to manual review rather than blocking — an
 * inconsistent transliteration is far commoner than a forgery."* So this screen
 * makes **no** matching judgement at all. It uploads, records the name as
 * written, and submits. `claims.adminSetNameMatch` is an admin's judgement by
 * design — never a string comparison — and the note under the field says so, so
 * that someone whose grandmother's name is spelled three ways across three
 * documents is not left thinking they have failed.
 *
 * ## What is uploaded, and what that costs
 *
 * The certificate is the one piece of **plaintext third-party personal data**
 * this product holds — a reviewer has to read it, and the claimant has no key a
 * reviewer could also open. `claims.generateCertificateUploadUrl` exists
 * separately from the asset upload path precisely so retention rules can find
 * it later.
 */
export function CertificateFlow() {
  const router = useRouter()
  const claims = useQuery(api.claims.mine)
  const generateUploadUrl = useMutation(api.claims.generateCertificateUploadUrl)
  const attachCertificate = useMutation(api.claims.attachCertificate)

  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<{ name: string; size: number } | null>(null)
  const [storageId, setStorageId] = useState<string | null>(null)
  const [deceasedName, setDeceasedName] = useState("")
  const [deathDate, setDeathDate] = useState("")
  const [place, setPlace] = useState("")
  const [reference, setReference] = useState("")
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const claim = claims?.[0] ?? null

  async function upload(picked: File) {
    setError(null)
    if (picked.size > MAX_BYTES) {
      setError(CLAIM_CERTIFICATE.tooLarge)
      return
    }
    if (!ACCEPTED.includes(picked.type)) {
      setError(CLAIM_CERTIFICATE.wrongType)
      return
    }
    setBusy(true)
    try {
      const url = await generateUploadUrl({})
      // A browser `File` is a Blob, so it goes straight to the upload URL —
      // none of the mobile app's file-staging dance is needed here.
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": picked.type },
        body: picked,
      })
      const body = (await response.json()) as { storageId?: string }
      if (typeof body.storageId !== "string") throw new Error("no storageId")
      setStorageId(body.storageId)
      setFile({ name: picked.name, size: picked.size })
    } catch {
      setError(CLAIM_CERTIFICATE.failed)
    } finally {
      setBusy(false)
    }
  }

  async function send() {
    if (storageId === null || claim === null) return
    setBusy(true)
    setError(null)
    try {
      // Attaches to the claim filed at step 1 by id. Re-calling `submit` would
      // need the subject's email again and would silently file nothing if it
      // were wrong — it answers `{ received: true }` either way by design.
      await attachCertificate({
        claimId: claim.id,
        certificateStorageId: storageId as Id<"_storage">,
        certificateName: deceasedName.trim(),
      })
      router.push(`/claim/${claim.id}`)
    } catch {
      setError(CLAIM_CERTIFICATE.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ClaimStepper
      current={2}
      reference={claim === null ? undefined : shortRef(claim.id)}
    >
      <h1 className="text-[27px] leading-[1.25]">{CLAIM_CERTIFICATE.heading}</h1>
      <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
        {CLAIM_CERTIFICATE.intro}
      </p>

      {file === null ? (
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const dropped = event.dataTransfer.files[0]
            if (dropped) void upload(dropped)
          }}
          className={`rounded-card mt-7 flex flex-col items-center gap-2 border-2 border-dashed px-6 py-12 text-center ${
            dragging ? "border-terracotta-600 bg-terracotta-100" : "border-sand-400"
          }`}
        >
          <p className="text-[16px] font-semibold">
            {CLAIM_CERTIFICATE.dropHere}
          </p>
          <p className="text-sand-600 text-[13px]">
            {CLAIM_CERTIFICATE.dropHint}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="border-border hover:bg-sand-200 mt-3 rounded-full border px-5 py-2.5 text-[14px] disabled:opacity-50"
          >
            {busy ? CLAIM_CERTIFICATE.uploading : CLAIM_CERTIFICATE.pickFile}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            hidden
            onChange={(event) => {
              const picked = event.target.files?.[0]
              if (picked) void upload(picked)
            }}
          />
        </div>
      ) : (
        <div className="bg-card rounded-card mt-7 flex items-center gap-3 p-4">
          <span
            aria-hidden
            className="bg-terracotta-200 text-terracotta-800 flex size-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
          >
            PDF
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-semibold">{file.name}</p>
            <p className="text-sand-600 text-[12.5px]">
              {(file.size / 1024 / 1024).toFixed(1)} م.ب ·{" "}
              {CLAIM_CERTIFICATE.uploaded}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFile(null)
              setStorageId(null)
            }}
            className="text-sand-600 hover:text-terracotta-700 text-[13px]"
          >
            {CLAIM_CERTIFICATE.replace}
          </button>
        </div>
      )}

      <section className="mt-6 flex flex-col gap-4">
        <Field
          label={CLAIM_CERTIFICATE.nameLabel}
          hint={CLAIM_CERTIFICATE.nameHint}
          value={deceasedName}
          onChange={setDeceasedName}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={CLAIM_CERTIFICATE.dateLabel}
            value={deathDate}
            onChange={setDeathDate}
            type="date"
            dir="ltr"
          />
          <Field
            label={CLAIM_CERTIFICATE.placeLabel}
            value={place}
            onChange={setPlace}
          />
        </div>
        <Field
          label={CLAIM_CERTIFICATE.refLabel}
          value={reference}
          onChange={setReference}
          dir="ltr"
        />
      </section>

      {/* Said before they submit, not after a mismatch. Someone whose
          grandmother's name is spelled three ways across three documents
          should not spend a month thinking they were caught lying. */}
      <p className="bg-olive-100 text-olive-700 rounded-card mt-5 p-4 text-[13.5px] leading-[1.7]">
        {CLAIM_CERTIFICATE.matchNote}
      </p>

      <button
        type="button"
        onClick={() => void send()}
        disabled={
        busy ||
        storageId === null ||
        claim === null ||
        deceasedName.trim().length === 0
      }
        className="bg-primary text-primary-foreground hover:bg-terracotta-600 mt-6 w-full rounded-full px-6 py-3.5 text-[15px] font-semibold disabled:opacity-50 sm:w-auto"
      >
        {busy ? CLAIM_CERTIFICATE.submitting : CLAIM_CERTIFICATE.submit}
      </button>
      <p className="text-sand-600 mt-2 text-[12.5px]">
        {CLAIM_CERTIFICATE.submitNote}
      </p>

      {error !== null ? (
        <p className="text-terracotta-800 mt-4 text-[14px]">{error}</p>
      ) : null}
    </ClaimStepper>
  )
}

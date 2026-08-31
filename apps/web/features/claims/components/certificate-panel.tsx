"use client"

import { useRef, useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { useMutation } from "convex/react"
import { FileCheck2Icon } from "lucide-react"

import { Button } from "@/components/button"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { Field } from "@/features/claims/components/field"
import { CLAIM_CERTIFICATE } from "@/features/claims/strings/claim-certificate"

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
 * exists for families who only have paper; the desktop path exists so the rest
 * are not forced through a camera they do not need.
 *
 * ## A name mismatch is never a rejection
 *
 * The board is emphatic: matching is *"fuzzy on transliteration, strict on
 * identity, and a mismatch routes to manual review rather than blocking — an
 * inconsistent transliteration is far commoner than a forgery."* So this panel
 * makes **no** matching judgement at all. It uploads, records the name as
 * written, and submits. `claims.adminSetNameMatch` is a human's judgement by
 * design, and the note under the field says so, so that someone whose
 * grandmother's name is spelled three ways across three documents is not left
 * thinking they have failed.
 *
 * ## What is uploaded, and what that costs
 *
 * The certificate is the one piece of **plaintext third-party personal data**
 * this product holds — a reviewer has to read it, and the claimant has no key a
 * reviewer could also open. `claims.generateCertificateUploadUrl` exists
 * separately from the asset upload path precisely so retention rules can find
 * it later.
 */
export function CertificatePanel({ claimId }: { claimId: string }) {
  const locale = useLocale()
  const labels = t(CLAIM_CERTIFICATE, locale)
  const generateUploadUrl = useMutation(api.claims.generateCertificateUploadUrl)
  const attachCertificate = useMutation(api.claims.attachCertificate)

  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<{ name: string; size: number } | null>(null)
  const [storageId, setStorageId] = useState<string | null>(null)
  const [deceasedName, setDeceasedName] = useState("")
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(picked: File) {
    setError(null)
    if (picked.size > MAX_BYTES) {
      setError(labels.tooLarge)
      return
    }
    if (!ACCEPTED.includes(picked.type)) {
      setError(labels.wrongType)
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
      setError(labels.failed)
    } finally {
      setBusy(false)
    }
  }

  async function send() {
    if (storageId === null) return
    setBusy(true)
    setError(null)
    try {
      await attachCertificate({
        claimId: claimId as Id<"claims">,
        certificateStorageId: storageId as Id<"_storage">,
        certificateName: deceasedName.trim(),
      })
      // No navigation: the claim's own query re-runs and this panel is replaced
      // by the next step. That is the point of hanging the flow off the report.
    } catch {
      setError(labels.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel accent="primary" icon={FileCheck2Icon} title={labels.heading}>
      <p className="text-muted-foreground max-w-[62ch] text-[14.5px] leading-[1.7]">
        {labels.intro}
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
          className={`rounded-card mt-5 flex flex-col items-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging ? "border-primary bg-background" : "border-sand-400"
          }`}
        >
          <p className="text-[15.5px] font-semibold">{labels.dropHere}</p>
          <p className="text-[13px] opacity-60">{labels.dropHint}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? labels.uploading : labels.pickFile}
          </Button>
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
        <div className="bg-background rounded-card mt-5 flex items-center gap-3 p-4">
          <span
            aria-hidden
            className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-full"
          >
            <FileCheck2Icon className="size-[17px]" strokeWidth={2.3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-semibold">{file.name}</p>
            <p className="text-[12.5px] opacity-60">
              {(file.size / 1024 / 1024).toFixed(1)} {labels.megabytes} ·{" "}
              {labels.uploaded}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFile(null)
              setStorageId(null)
            }}
            className="text-[13px] font-semibold opacity-60 hover:opacity-100"
          >
            {labels.replace}
          </button>
        </div>
      )}

      <div className="mt-5">
        <Field
          label={labels.nameLabel}
          hint={labels.nameHint}
          value={deceasedName}
          onChange={setDeceasedName}
        />
      </div>

      {/* Said before they submit, not after a mismatch. Someone whose
          grandmother's name is spelled three ways across three documents should
          not spend a month thinking they were caught lying. */}
      <p className="bg-olive-100 text-olive-700 rounded-card mt-5 p-4 text-[13.5px] leading-[1.7]">
        {labels.matchNote}
      </p>

      <Button
        className="mt-5"
        onClick={() => void send()}
        disabled={busy || storageId === null || deceasedName.trim().length === 0}
      >
        {busy ? labels.submitting : labels.submit}
      </Button>
      <p className="mt-2 text-[12.5px] opacity-60">{labels.submitNote}</p>

      {error !== null && <p className="mt-4 text-[14px]">{error}</p>}
    </Panel>
  )
}

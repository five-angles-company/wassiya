"use client"

import { useRef, useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { useMutation } from "convex/react"
import { FileCheckIcon, ShieldCheckIcon, UploadIcon } from "lucide-react"

import { Button } from "@/components/button"
import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { Field } from "@/components/field"
import { CLAIM_CERTIFICATE } from "@/features/claims/strings/claim-certificate"

const MAX_BYTES = 20 * 1024 * 1024
const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/heic"]

/**
 * ٧.٣ — the death certificate. Drag-and-drop because the certificate usually
 * arrives as a PDF already on the laptop; the camera path exists for families
 * who only have paper.
 *
 * **A name mismatch is never a rejection here.** Matching is *"fuzzy on
 * transliteration, strict on identity, and a mismatch routes to manual review
 * rather than blocking — an inconsistent transliteration is far commoner than a
 * forgery."* So this panel makes no matching judgement at all: it uploads,
 * records the name as written, and submits. `claims.adminSetNameMatch` is a
 * human's judgement by design, and the note under the field says so.
 *
 * The certificate is the one piece of plaintext third-party personal data this
 * product holds — a reviewer has to read it, and the claimant has no key a
 * reviewer could also open. `claims.generateCertificateUploadUrl` is separate
 * from the asset upload path precisely so retention rules can find it later.
 */
export function CertificatePanel({
  claimId,
}: {
  claimId: string
}) {
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
    <div className="flex flex-col gap-5">
      <p className="text-foreground/75 max-w-[62ch] text-[15.5px] leading-[1.85]">{labels.intro}</p>

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
          className={`rounded-row flex flex-col items-center gap-2 border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging ? "border-primary bg-accent/40" : "bg-background/60 border-[color:var(--input)]"
          }`}
        >
          <IconDisc icon={UploadIcon} tone="attention" />
          <p className="mt-2 text-[16px] font-bold">{labels.dropHere}</p>
          <p className="text-muted-foreground text-[13.5px]">{labels.dropHint}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => inputRef.current?.click()} disabled={busy}>
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
        <div className="bg-tone-settled-soft rounded-row flex items-center gap-4 p-4">
          <IconDisc icon={FileCheckIcon} tone="settled" size="sm" shape="circle" className="bg-card" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{file.name}</p>
            <p className="text-tone-settled text-[13px] font-semibold">
              {(file.size / 1024 / 1024).toFixed(1)} {labels.megabytes} · {labels.uploaded}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFile(null)
              setStorageId(null)
            }}
          >
            {labels.replace}
          </Button>
        </div>
      )}

      <Field label={labels.nameLabel} hint={labels.nameHint} value={deceasedName} onChange={setDeceasedName} />

      {/* Said before they send, not after a mismatch: someone whose
          grandmother's name is spelled three ways should not spend a month
          thinking they were caught lying. */}
      <p className="text-tone-settled flex items-start gap-2 text-[14px] leading-[1.7] font-semibold">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} aria-hidden />
        {labels.matchNote}
      </p>

      <div className="border-border flex flex-col items-start gap-2 border-t pt-6">
        <Button
          size="lg"
          onClick={() => void send()}
          disabled={busy || storageId === null || deceasedName.trim().length === 0}
        >
          {busy ? labels.submitting : labels.submit}
        </Button>
        <p className="text-muted-foreground text-[13px]">{labels.submitNote}</p>
      </div>

      {error !== null && <p className="text-tone-attention text-[14.5px] font-semibold">{error}</p>}
    </div>
  )
}

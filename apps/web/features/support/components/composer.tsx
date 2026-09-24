"use client"

import { useRef, useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { looksLikeRecoveryCode } from "@workspace/crypto/papercode"
import { useMutation } from "convex/react"

import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"
import { supportError } from "@/features/support/lib/errors"
import { MESSAGE_BOX } from "@/features/support/lib/message-box"
import { ACCEPT, uploadAll } from "@/features/support/lib/upload"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"

const MAX_FILES = 5

/**
 * The reply box under a conversation. A pasted recovery code is caught here
 * before it leaves the browser; the backend refuses it again regardless.
 */
export function Composer({
  threadId,
  guestToken,
}: {
  threadId: Id<"supportThreads">
  guestToken: string | undefined
}) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const send = useMutation(api.support.threads.send)
  const uploadUrl = useMutation(api.support.threads.generateUploadUrl)
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const picker = useRef<HTMLInputElement>(null)

  const sheetInText = looksLikeRecoveryCode(body)
  const canSend =
    !busy && !sheetInText && (body.trim().length > 0 || files.length > 0)

  async function submit() {
    if (!canSend) return
    setBusy(true)
    setError(null)
    try {
      const attachments = await uploadAll(files, () =>
        uploadUrl({ guestToken, threadId })
      )
      await send({ guestToken, threadId, body, attachments })
      setBody("")
      setFiles([])
    } catch (cause) {
      setError(supportError(cause, locale))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={labels.replyPlaceholder}
        rows={3}
        className={MESSAGE_BOX}
        aria-invalid={sheetInText || undefined}
      />
      {sheetInText && (
        <p role="alert" className="text-tone-attention text-[13.5px] font-semibold">
          {labels.recoveryWarning}
        </p>
      )}
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="bg-muted inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13.5px]"
            >
              {file.name}
              <button
                type="button"
                className="text-muted-foreground"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                aria-label={labels.removeFile}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {error !== null && (
        <p role="alert" className="text-tone-attention text-[13.5px]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={picker}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? [])
            setFiles([...files, ...picked].slice(0, MAX_FILES))
            event.target.value = ""
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => picker.current?.click()}
          disabled={busy || files.length >= MAX_FILES}
        >
          {labels.attach}
        </Button>
        <Button className="ms-auto" onClick={submit} disabled={!canSend}>
          {busy ? labels.sending : labels.send}
        </Button>
      </div>
      <p className="text-muted-foreground text-[13px] leading-[1.7]">{labels.guardrail}</p>
    </div>
  )
}

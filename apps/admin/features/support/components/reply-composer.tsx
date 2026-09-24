"use client"

import { useRef, useState } from "react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { useMutation } from "convex/react"
import { PaperclipIcon, SendIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { useLocale } from "@/components/locale-provider"
import { errorMessage } from "@/features/support/lib/labels"
import { ACCEPT, uploadAll } from "@/features/support/lib/upload"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"

const MAX_FILES = 5

export function ReplyComposer({
  threadId,
}: {
  threadId: Id<"supportThreads">
}) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const reply = useMutation(api.support.admin.adminReply)
  const uploadUrl = useMutation(api.support.admin.adminGenerateUploadUrl)
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const picker = useRef<HTMLInputElement>(null)

  const canSend = !busy && (body.trim().length > 0 || files.length > 0)

  async function send() {
    if (!canSend) return
    setBusy(true)
    try {
      const attachments = await uploadAll(files, () => uploadUrl())
      await reply({ threadId, body, attachments })
      setBody("")
      setFiles([])
    } catch (error) {
      toast.error(errorMessage(error, locale))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t p-3">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            void send()
          }
        }}
        placeholder={labels.replyPlaceholder}
        className="max-h-48"
      />
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {files.map((file, index) => (
            <li
              key={index}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {file.name}
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                aria-label={labels.cancel}
              >
                <XIcon className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
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
          <PaperclipIcon />
          {labels.attach}
        </Button>
        <Button className="ms-auto" size="sm" onClick={send} disabled={!canSend}>
          <SendIcon className="rtl:-scale-x-100" />
          {labels.send}
        </Button>
      </div>
    </div>
  )
}

"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ExternalLinkIcon, FileQuestionIcon } from "lucide-react"

import { CLAIMS } from "@/features/claims/strings/claims"
import { t, type Locale } from "@/lib/i18n/locale"

/**
 * The death certificate itself, large, because it is what the decision rests
 * on. Images and PDFs render inline; anything else opens in a new tab.
 */
export function ClaimCertificate({
  url,
  contentType,
  locale,
}: {
  url: string | null
  contentType: string | null
  locale: Locale
}) {
  const labels = t(CLAIMS, locale)
  const isImage = contentType?.startsWith("image/") === true
  const isPdf = contentType === "application/pdf"

  return (
    // Fills the row: the decision beside it is usually taller, and a short
    // certificate card left a band of empty page under it.
    <Card className="flex h-full min-h-[560px] flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b py-3">
        <CardTitle className="font-heading text-base">
          {labels.certificateTitle}
        </CardTitle>
        {url !== null && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLinkIcon className="size-3.5" />
            {labels.certificateOpen}
          </a>
        )}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col bg-muted/40 p-0">
        {url === null ? (
          <Empty text={labels.certificateNone} />
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- a signed storage URL, not an optimisable asset
          <img
            src={url}
            alt={labels.certificateTitle}
            className="min-h-0 w-full flex-1 object-contain"
          />
        ) : isPdf ? (
          <iframe
            src={url}
            title={labels.certificateTitle}
            className="min-h-0 w-full flex-1 border-0"
          />
        ) : (
          <Empty text={labels.certificateUnsupported} />
        )}
      </CardContent>
    </Card>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
      <FileQuestionIcon className="size-6" />
      {text}
    </div>
  )
}

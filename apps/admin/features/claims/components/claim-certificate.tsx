"use client"

import {
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import {
  ExternalLinkIcon,
  FileQuestionIcon,
  RotateCwIcon,
  ScanIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"

import { CLAIMS } from "@/features/claims/strings/claims"
import { t, type Locale } from "@/lib/i18n/locale"

const ZOOMS = [1, 1.5, 2, 3, 4] as const

// Accepted by the web upload for iPhone photos, but only Safari can draw them.
const UNDRAWABLE = ["image/heic", "image/heif"]

/**
 * The death certificate, fitted to the frame so the whole document is readable
 * without scrolling the page. Images zoom, pan and rotate; a PDF uses the
 * browser's own viewer; anything else opens in a new tab.
 */
export function ClaimCertificate({
  url,
  contentType,
  locale,
  className,
}: {
  url: string | null
  contentType: string | null
  locale: Locale
  className?: string
}) {
  const labels = t(CLAIMS, locale)
  const [zoom, setZoom] = useState(1)
  const [turns, setTurns] = useState(0)
  const [broken, setBroken] = useState(false)

  const isPdf = contentType === "application/pdf"
  const isImage =
    contentType?.startsWith("image/") === true &&
    !UNDRAWABLE.includes(contentType) &&
    !broken
  const step = ZOOMS.indexOf(zoom as (typeof ZOOMS)[number])

  return (
    <Card className={cn("flex flex-col gap-0 overflow-hidden py-0", className)}>
      <div className="flex h-12 shrink-0 items-center gap-1 border-b ps-4 pe-2">
        <h2 className="me-auto font-heading text-base font-semibold">
          {labels.certificateTitle}
        </h2>
        {url !== null && isImage && (
          <>
            <Tool
              label={labels.zoomOut}
              disabled={step <= 0}
              onClick={() => setZoom(ZOOMS[step - 1] ?? 1)}
            >
              <ZoomOutIcon />
            </Tool>
            <Tool
              label={labels.zoomIn}
              disabled={step >= ZOOMS.length - 1}
              onClick={() => setZoom(ZOOMS[step + 1] ?? zoom)}
            >
              <ZoomInIcon />
            </Tool>
            <Tool
              label={labels.zoomFit}
              disabled={zoom === 1}
              onClick={() => setZoom(1)}
            >
              <ScanIcon />
            </Tool>
            <Tool
              label={labels.rotate}
              onClick={() => setTurns((n) => (n + 1) % 4)}
            >
              <RotateCwIcon />
            </Tool>
          </>
        )}
        {url !== null && (
          <Tool label={labels.certificateOpen} href={url}>
            <ExternalLinkIcon />
          </Tool>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-muted/40">
        {url === null ? (
          <Empty text={labels.certificateMissing} />
        ) : isImage ? (
          <ImageStage
            url={url}
            alt={labels.certificateTitle}
            zoom={zoom}
            turns={turns}
            onError={() => setBroken(true)}
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
      </div>
    </Card>
  )
}

/**
 * The image is laid out at its zoomed size rather than CSS-scaled, so the frame
 * scrolls over all of it. The stage is `dir="ltr"`: scroll offsets are then the
 * same sign in both locales, and a document has no reading direction to keep.
 */
function ImageStage({
  url,
  alt,
  zoom,
  turns,
  onError,
}: {
  url: string
  alt: string
  zoom: number
  turns: number
  onError: () => void
}) {
  const stage = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)
  const drag = useRef<{
    x: number
    y: number
    left: number
    top: number
  } | null>(null)
  const shownZoom = useRef(zoom)

  useLayoutEffect(() => {
    const element = stage.current
    if (element === null) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry === undefined) return
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Zoom about the middle of what is on screen, not the top-left corner.
  useLayoutEffect(() => {
    const element = stage.current
    if (element === null) return
    const ratio = zoom / shownZoom.current
    const x = element.scrollLeft + element.clientWidth / 2
    const y = element.scrollTop + element.clientHeight / 2
    element.scrollLeft = x * ratio - element.clientWidth / 2
    element.scrollTop = y * ratio - element.clientHeight / 2
    shownZoom.current = zoom
  }, [zoom])

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const element = stage.current
    if (element === null || zoom === 1) return
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      left: element.scrollLeft,
      top: element.scrollTop,
    }
    element.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const element = stage.current
    const start = drag.current
    if (element === null || start === null) return
    element.scrollLeft = start.left - (event.clientX - start.x)
    element.scrollTop = start.top - (event.clientY - start.y)
  }

  const sideways = turns % 2 === 1

  return (
    <div
      ref={stage}
      dir="ltr"
      className={cn(
        "min-h-0 flex-1 overflow-auto select-none",
        zoom > 1 && "cursor-grab active:cursor-grabbing"
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      {box !== null && (
        <div
          className="relative"
          style={{ width: box.w * zoom, height: box.h * zoom }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a signed storage URL, not an optimisable asset */}
          <img
            src={url}
            alt={alt}
            draggable={false}
            onError={onError}
            className="absolute max-w-none object-contain"
            style={{
              left: "50%",
              top: "50%",
              width: (sideways ? box.h : box.w) * zoom,
              height: (sideways ? box.w : box.h) * zoom,
              transform: `translate(-50%, -50%) rotate(${turns * 90}deg)`,
            }}
          />
        </div>
      )}
    </div>
  )
}

function Tool({
  label,
  disabled,
  onClick,
  href,
  children,
}: {
  label: string
  disabled?: boolean
  onClick?: () => void
  href?: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href === undefined ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          >
            {children}
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={href} target="_blank" rel="noreferrer" aria-label={label}>
              {children}
            </a>
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
      <FileQuestionIcon className="size-6" />
      {text}
    </div>
  )
}

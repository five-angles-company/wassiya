import { useEffect, useRef } from "react"
import { View } from "react-native"
import QRCode from "react-native-qrcode-svg"

export type KitQrProps = {
  /** `WSYB1:<base64url blob>` — the wrapped key, never the paper code. */
  value: string
  size?: number
  /** Receives a PNG data URI for the print HTML, or null if capture failed. */
  onCaptured: (dataUri: string | null) => void
}

/**
 * The QR on the recovery sheet.
 *
 * It encodes the **wrapped key blob, not the recovery code**. That is a
 * deliberate split: the code carries S_paper for a human to retype, the QR
 * carries `Enc(K_rec, MK)` for a machine to read, and neither is any use
 * without the guardian's share. Together they make the sheet a complete
 * offline half of the 2-of-3 — putting the code in the QR as well would add
 * nothing but a second way to leak it.
 *
 * The PNG is captured for the print document because `expo-print` renders in a
 * WebView that cannot reach this component tree; a data URI is the only way the
 * image travels with the HTML.
 */
export function KitQr({ value, size = 128, onCaptured }: KitQrProps) {
  const svgRef = useRef<{ toDataURL: (cb: (data: string) => void) => void }>(
    null
  )

  useEffect(() => {
    // The ref is only populated after the SVG has rendered, so capture is
    // deferred a tick rather than run during layout.
    const timer = setTimeout(() => {
      const svg = svgRef.current
      if (svg === null) {
        onCaptured(null)
        return
      }
      try {
        svg.toDataURL((base64) => onCaptured(`data:image/png;base64,${base64}`))
      } catch {
        // A missing QR degrades the sheet; it does not invalidate it. The
        // printed code alone is still a complete paper share.
        onCaptured(null)
      }
    }, 120)
    return () => clearTimeout(timer)
  }, [value, onCaptured])

  return (
    <View className="overflow-hidden rounded-xs bg-white p-1">
      <QRCode
        value={value}
        size={size}
        color="#201e1d"
        backgroundColor="#ffffff"
        // Medium correction: the sheet is printed and filed, so it has to
        // survive a fold or a scuff, but the payload is small enough that
        // higher levels only make the modules harder to scan.
        ecl="M"
        getRef={(c) => {
          svgRef.current = c
        }}
      />
    </View>
  )
}

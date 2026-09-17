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
 * The QR on the recovery sheet. It encodes the **wrapped key blob, not the
 * recovery code**: the code carries S_paper for a human to retype, the QR
 * carries `Enc(K_rec, MK)` for a machine to read, and putting the code in both
 * would add only a second way to leak it.
 *
 * Since `K_rec = S_paper`, the two halves printed here are the complete recovery
 * input — so what stands between a photograph and an open vault is the AAD. The
 * wrapper is sealed under the owner's **user id** and the paper version; the
 * version is printed, the id is not, and it is not derivable from the name or
 * email on the page. Opening this offline is therefore infeasible, and the sheet
 * is a bearer token *within* the account rather than outside it.
 *
 * ⚠️ **Do not print the user id on this sheet, and do not put it in the QR.**
 *
 * The PNG is captured for the print document because `expo-print` renders in a
 * WebView that cannot reach this component tree.
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

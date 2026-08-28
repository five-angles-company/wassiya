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
 * deliberate split: the code carries S_paper for a human to retype and the QR
 * carries `Enc(K_rec, MK)` for a machine to read. Putting the code in the QR as
 * well would add nothing but a second way to leak it.
 *
 * ## What stops this page being the whole vault
 *
 * It used to be "neither is any use without the guardian's share". That is no
 * longer true — K_rec is S_paper alone — so the two halves printed here are
 * now the complete recovery input, and it is worth being exact about what
 * still stands between a photograph and an open vault.
 *
 * The wrapper is sealed under an AAD of the owner's **user id** and the paper
 * version. The version is printed; the id is not, and it is not derivable from
 * the name or the email on the page. So opening this offline is infeasible:
 * the id comes from the account, and reaching the account means signing in as
 * the owner. The sheet is a bearer token *within* that account, not outside it.
 *
 * That property is load-bearing rather than incidental. **Do not print the user
 * id on this sheet**, and do not put it in the QR.
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

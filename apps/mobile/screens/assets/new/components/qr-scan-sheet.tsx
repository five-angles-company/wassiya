import { useEffect, useRef, useState } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import { CameraView, useCameraPermissions } from "expo-camera"
import { View } from "react-native"

export type QrScanSheetProps = {
  ref?: React.Ref<TrueSheet>
  labels: Record<string, string>
  /** Receives the raw scanned string. The caller decides what it means. */
  onScanned: (value: string) => void
  onDismiss?: () => void
}

/**
 * ٤.٣'s "مسح QR" — reading a recovery phrase off a backup card.
 *
 * ## Why the camera lives in a sheet and not a screen
 *
 * The phrase being scanned into is half-typed on the form behind it. A pushed
 * route would unmount that state on some navigation paths and, worse, would
 * make "cancel" feel like leaving the wizard. A sheet keeps the form alive and
 * visible underneath.
 *
 * ## The camera is mounted only while the sheet is open
 *
 * `CameraView` holds the hardware for as long as it is rendered. Mounting it
 * with the screen would keep the camera live behind a seed phrase for the whole
 * time the wizard is open — a permission the user granted for one scan turned
 * into a session-long open lens. It mounts on present and unmounts on dismiss.
 *
 * ## One scan, then stop
 *
 * `onBarcodeScanned` fires continuously once a code is in frame — several times
 * a second. Without the latch, a single QR would call back a dozen times and
 * overwrite the field on each, which looks like flicker and defeats the paste
 * guard. The latch resets when the sheet is presented again.
 */
export function QrScanSheet({
  ref,
  labels,
  onScanned,
  onDismiss,
}: QrScanSheetProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [active, setActive] = useState(false)
  const latched = useRef(false)

  // Reset the latch whenever the sheet closes, so a second scan works.
  useEffect(() => {
    if (!active) latched.current = false
  }, [active])

  const granted = permission?.granted === true

  return (
    <Sheet
      ref={ref}
      title={labels.scanTitle}
      description={labels.scanBody}
      onPresent={() => setActive(true)}
      onDismiss={() => {
        setActive(false)
        onDismiss?.()
      }}
    >
      <View className="gap-3">
        {granted ? (
          <View className="rounded-card aspect-square w-full overflow-hidden bg-black">
            {active ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={({ data }) => {
                  if (latched.current) return
                  latched.current = true
                  onScanned(data)
                }}
              />
            ) : null}
          </View>
        ) : (
          <View className="rounded-card bg-card gap-3 p-4">
            <Text variant="metaSm" className="text-muted-foreground">
              {permission?.canAskAgain === false
                ? labels.cameraBlocked
                : labels.cameraNeeded}
            </Text>
            {permission?.canAskAgain !== false ? (
              <Button size="sm" onPress={() => void requestPermission()}>
                <Text>{labels.cameraAllow}</Text>
              </Button>
            ) : null}
          </View>
        )}
      </View>
    </Sheet>
  )
}


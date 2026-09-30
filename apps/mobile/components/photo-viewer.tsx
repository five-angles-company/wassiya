import { X } from "lucide-react-native"
import { Image, Modal, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { IconButton } from "@/components/icon-button"

/**
 * One decrypted photo, full screen. The source is a `data:` URI held only by
 * this component — closing it is what lets the plaintext go.
 */
export function PhotoViewer({
  uri,
  closeLabel,
  onClose,
}: {
  uri: string | null
  closeLabel: string
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <Modal
      visible={uri !== null}
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={["portrait"]}
    >
      <View className="flex-1 bg-foreground">
        {uri !== null ? (
          <Image source={{ uri }} resizeMode="contain" className="flex-1" />
        ) : null}
        <View className="absolute end-4" style={{ top: insets.top + 12 }}>
          <IconButton icon={X} label={closeLabel} onPress={onClose} />
        </View>
      </View>
    </Modal>
  )
}

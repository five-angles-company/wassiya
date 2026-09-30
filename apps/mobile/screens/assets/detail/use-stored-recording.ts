import { useRef } from "react"
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio"

import { VOICE_MIME_TYPE } from "@/hooks/use-voice-note"
import type { SourceFile } from "@/screens/assets/detail/forms/source"
import type { useStoredFiles } from "@/screens/assets/detail/use-stored-files"

/**
 * Plays a saved voice note. The recording is decrypted once, on the first
 * listen, into a file `useStoredFiles` deletes when the screen closes.
 */
export function useStoredRecording(
  file: SourceFile | undefined,
  stored: ReturnType<typeof useStoredFiles>
) {
  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)
  const loaded = useRef(false)

  async function play() {
    if (file === undefined) return
    if (!loaded.current) {
      const out = await stored.toFile(file, VOICE_MIME_TYPE)
      if (out === null) return
      player.replace({ uri: out.uri })
      loaded.current = true
    } else if (status.didJustFinish || status.currentTime >= status.duration) {
      // A finished player keeps its position at the end and would replay
      // nothing; rewinding first makes the button mean what it says.
      await player.seekTo(0)
    }
    // A recording just made leaves the session routed for the microphone.
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
    player.play()
  }

  return {
    playing: status.playing,
    loading: file !== undefined && stored.busy === file.storageId,
    play: () => void play(),
    pause: () => player.pause(),
  }
}

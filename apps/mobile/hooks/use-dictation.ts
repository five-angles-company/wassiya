/**
 * On-device dictation for ٤.٨, where the qualifier is the requirement. The
 * default speech path on both platforms streams audio to the vendor's servers,
 * which for an app promising we cannot read what you write would route the
 * plaintext straight past every guarantee the screen makes two lines below the
 * text box.
 *
 * `requiresOnDeviceRecognition` is set, and where the device cannot do it the
 * button is **hidden rather than degraded** — a dictation button that silently
 * uploads is worse than no dictation button. Arabic on-device recognition
 * depends on the installed language pack, so absence is the expected outcome on
 * plenty of handsets, not a bug to work around.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition"

export type Dictation = {
  /** False when this device cannot recognise on-device; hide the affordance. */
  available: boolean
  listening: boolean
  /** Final transcript since the last start, appended by the caller. */
  transcript: string
  start: () => void
  stop: () => void
  reset: () => void
}

export function useDictation(locale: "ar" | "en"): Dictation {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")

  // Both must hold: the module can be present while the device has no
  // on-device recogniser for any language.
  const available = useMemo(() => {
    try {
      return (
        ExpoSpeechRecognitionModule.isRecognitionAvailable() &&
        ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()
      )
    } catch {
      return false
    }
  }, [])

  useSpeechRecognitionEvent("result", (event) => {
    // Interim results arrive continuously; only a final one is committed, so
    // the note is not rewritten mid-sentence on every syllable.
    if (!event.isFinal) return
    const text = event.results[0]?.transcript ?? ""
    if (text.length > 0) setTranscript((current) => `${current} ${text}`.trim())
  })
  useSpeechRecognitionEvent("end", () => setListening(false))
  useSpeechRecognitionEvent("error", () => setListening(false))

  // Leaving mid-sentence must release the microphone.
  useEffect(
    () => () => {
      try {
        ExpoSpeechRecognitionModule.abort()
      } catch {
        // Nothing running; nothing to release.
      }
    },
    []
  )

  const start = useCallback(() => {
    void (async () => {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!permission.granted) return
      setTranscript("")
      setListening(true)
      ExpoSpeechRecognitionModule.start({
        lang: locale === "ar" ? "ar-SA" : "en-US",
        interimResults: false,
        continuous: true,
        requiresOnDeviceRecognition: true,
      })
    })()
  }, [locale])

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop()
    setListening(false)
  }, [])

  return {
    available,
    listening,
    transcript,
    start,
    stop,
    reset: () => setTranscript(""),
  }
}

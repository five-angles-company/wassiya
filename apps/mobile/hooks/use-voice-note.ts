/**
 * Recording and playing back the voice half of ٤.٨, before any of it is
 * encrypted.
 *
 * ⚠️ **The recording is plaintext on disk for its whole life here.** expo-audio
 * writes an `.m4a` into the cache directory and there is no way to record
 * straight into memory, so this hook owns that file: `discard` and `clear`
 * delete it, and the screen must call one of them on every path that abandons
 * or finishes the note. Nothing may persist the uri — a path in AsyncStorage
 * would outlive the screen that knows to delete it.
 *
 * Recording and playback need opposite audio sessions on iOS. Leaving
 * `allowsRecording: true` set after a recording stops routes playback through
 * the earpiece at a fraction of the volume, which reads as "my recording came
 * out silent", so the mode is flipped back at every stop.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  type RecordingOptions,
} from "expo-audio"

import { discardLocalFile, fileSize } from "@/lib/asset-upload"

/**
 * Speech, not music: one channel at 64 kbit/s AAC. The `.m4a` container is the
 * same on both platforms, so everything downstream — the stored mime type, the
 * heir's download, the filename extension — has one case to handle.
 */
const VOICE_RECORDING: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64_000,
  isMeteringEnabled: true,
}

export const VOICE_MIME_TYPE = "audio/mp4"

/** Ten minutes ≈ 4.8 MB. Long enough for a letter read aloud, short enough to
 *  encrypt and upload in one buffer on a mid-range handset. */
export const MAX_VOICE_MS = 10 * 60_000

/** How many bars the meter shows, and how many samples a finished take keeps. */
const BARS = 21

const POLL_MS = 100

export type VoiceTake = {
  uri: string
  durationMs: number
  byteSize: number
  /** Downsampled levels, 0–1, for the finished waveform. */
  levels: number[]
}

export type VoiceNoteState = "idle" | "recording" | "recorded"

export type VoiceNote = {
  state: VoiceNoteState
  /** Elapsed while recording; the take's length once stopped. */
  durationMs: number
  /** The live meter while recording, the take's waveform once stopped. */
  levels: number[]
  take: VoiceTake | null
  playing: boolean
  error: "permission" | "failed" | null
  start: () => void
  stop: () => void
  play: () => void
  pause: () => void
  /** Throw the take away and return to idle. Deletes the file. */
  discard: () => void
  /** Delete the file without touching state — for after the ciphertext exists. */
  clear: () => void
}

export function useVoiceNote(): VoiceNote {
  const recorder = useAudioRecorder(VOICE_RECORDING)
  const [state, setState] = useState<VoiceNoteState>("idle")
  const [durationMs, setDurationMs] = useState(0)
  const [levels, setLevels] = useState<number[]>([])
  const [take, setTake] = useState<VoiceTake | null>(null)
  const [error, setError] = useState<"permission" | "failed" | null>(null)

  const player = useAudioPlayer(take?.uri ?? null)
  const status = useAudioPlayerStatus(player)

  /** Every sample of the take in progress, downsampled to `BARS` at stop. */
  const samples = useRef<number[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  /** Read by the unmount cleanup, which must not capture a stale take. */
  const staged = useRef<string | null>(null)

  const stopPolling = useCallback(() => {
    if (timer.current !== null) {
      clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  // Leaving mid-take must release the microphone and delete the file.
  useEffect(
    () => () => {
      stopPolling()
      if (staged.current !== null) discardLocalFile(staged.current)
    },
    [stopPolling]
  )

  const finish = useCallback(async () => {
    stopPolling()
    try {
      await recorder.stop()
    } catch {
      // Already stopped, or never started; the uri below is the real answer.
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })

    const uri = recorder.uri
    if (uri === null) {
      setState("idle")
      setError("failed")
      return
    }
    const recorded = {
      uri,
      durationMs: Math.round(recorder.currentTime * 1000),
      byteSize: fileSize(uri),
      levels: downsample(samples.current, BARS),
    }
    staged.current = uri
    setTake(recorded)
    setDurationMs(recorded.durationMs)
    setLevels(recorded.levels)
    setState("recorded")
  }, [recorder, stopPolling])

  const start = useCallback(() => {
    void (async () => {
      const permission = await requestRecordingPermissionsAsync()
      if (!permission.granted) {
        setError("permission")
        return
      }
      setError(null)
      // A second take replaces the first, so the first must not survive it.
      if (staged.current !== null) {
        discardLocalFile(staged.current)
        staged.current = null
      }
      setTake(null)
      samples.current = []
      setLevels([])
      setDurationMs(0)

      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
        await recorder.prepareToRecordAsync(VOICE_RECORDING)
        recorder.record()
      } catch {
        setError("failed")
        setState("idle")
        return
      }
      setState("recording")

      timer.current = setInterval(() => {
        const current = recorder.getStatus()
        samples.current.push(toLevel(current.metering))
        setLevels(samples.current.slice(-BARS))
        setDurationMs(current.durationMillis)
        if (current.durationMillis >= MAX_VOICE_MS) void finish()
      }, POLL_MS)
    })()
  }, [finish, recorder])

  const discard = useCallback(() => {
    player.pause()
    if (staged.current !== null) {
      discardLocalFile(staged.current)
      staged.current = null
    }
    setTake(null)
    setLevels([])
    setDurationMs(0)
    setState("idle")
  }, [player])

  const clear = useCallback(() => {
    if (staged.current !== null) {
      discardLocalFile(staged.current)
      staged.current = null
    }
  }, [])

  return {
    state,
    durationMs,
    levels,
    take,
    playing: status.playing,
    error,
    start,
    stop: () => void finish(),
    play: () => {
      // A finished player keeps its position at the end and would replay
      // nothing; rewinding first makes the button mean what it says.
      if (status.didJustFinish || status.currentTime >= status.duration) {
        void player.seekTo(0)
      }
      player.play()
    },
    pause: () => player.pause(),
    discard,
    clear,
  }
}

/** −160…0 dBFS to 0–1, with everything under −60 dB treated as silence. */
function toLevel(metering: number | undefined): number {
  if (metering === undefined) return 0
  return Math.min(1, Math.max(0, (metering + 60) / 60))
}

/** The take's whole envelope in `count` bars, so a long note is not shown as
 *  its last two seconds. */
function downsample(values: number[], count: number): number[] {
  if (values.length === 0) return []
  if (values.length <= count) return values
  const size = values.length / count
  return Array.from({ length: count }, (_, index) => {
    const slice = values.slice(Math.floor(index * size), Math.floor((index + 1) * size))
    return slice.length === 0 ? 0 : Math.max(...slice)
  })
}

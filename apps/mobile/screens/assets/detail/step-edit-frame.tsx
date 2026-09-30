/**
 * One step of a saved asset, opened from its card on the asset page.
 *
 * ⚠️ **A guarded step asks for a fingerprint here, not on the card.** The
 * route can be reached without tapping the card, so the gate lives where the
 * secret is shown. `disableDeviceFallback: true` because a passcode is
 * something a person holding the phone may also know; this proves a *person*
 * is present. The reveal is audited once the phrase is on screen.
 */
import { useCallback, useEffect, useState } from "react"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { ScreenTop } from "@workspace/ui-native/components/wassiya/screen-top"
import * as LocalAuthentication from "expo-local-authentication"
import { Redirect, router } from "expo-router"
import { Fingerprint, Lock } from "lucide-react-native"

import { CenteredNote } from "@/components/centered-note"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import type {
  EditorLoad,
  SaveError,
} from "@/screens/assets/detail/use-asset-editor"
import { StepFlow } from "@/screens/assets/flow/step-flow"
import type { FlowStep } from "@/screens/assets/flow/types"

export type StepEditFrameProps = {
  load: EditorLoad
  /** False when the payload could not be parsed into this type's form. */
  readable: boolean
  step: FlowStep | undefined
  kicker: string
  onSave: () => void
  saving: boolean
  error: SaveError | null
  dirty: boolean
  /** Audits a reveal — called once a guarded step is shown. */
  onReveal: () => void
  /** A failure that is not the save's own — opening a stored file. */
  notice?: string
}

export function StepEditFrame({
  load,
  readable,
  step,
  kicker,
  onSave,
  saving,
  error,
  dirty,
  onReveal,
  notice,
}: StepEditFrameProps) {
  const { t } = useStrings("assets/detail")
  const { t: chrome } = useStrings("assets/new")
  const { t: common } = useStrings("common")
  const guarded = step?.guarded === true
  const [unlocked, setUnlocked] = useState(false)

  const leave = useCallback(
    () => (router.canGoBack() ? router.back() : router.replace("/assets")),
    []
  )

  const authenticate = useCallback(
    () =>
      LocalAuthentication.authenticateAsync({
        promptMessage: t.biometricPrompt!,
        disableDeviceFallback: true,
      }).then((auth) => {
        if (!auth.success) return
        setUnlocked(true)
        onReveal()
      }),
    [onReveal, t.biometricPrompt]
  )

  const ready = load.status === "ready" && readable && step !== undefined
  useEffect(() => {
    if (ready && guarded) void authenticate()
    // Once, when the step can first be shown — a declined prompt waits for
    // the button rather than re-raising itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  if (load.status === "gone") return <Redirect href="/assets" />

  if (!ready || (guarded && !unlocked)) {
    const message =
      load.status === "loading"
        ? common.loading
        : load.status === "locked"
          ? t.saveLocked
          : !ready
            ? t.revealFailed
            : t.revealPrompt
    return (
      <Screen
        footer={
          ready && guarded ? (
            <PrimaryCta
              label={t.revealPrompt!}
              onPress={() => void authenticate()}
            />
          ) : undefined
        }
      >
        <ScreenTop backLabel={common.back} onBack={leave} className="mb-4" />
        <CenteredNote
          icon={ready && guarded ? Fingerprint : Lock}
          body={message!}
        />
      </Screen>
    )
  }

  return (
    <StepFlow
      single
      kicker={kicker}
      // An unchanged step has nothing to save; the button stays surface-toned.
      steps={[
        { ...step, blocked: step.blocked ?? (dirty ? null : chrome.saveEdit!) },
      ]}
      finishLabel={chrome.saveEdit!}
      onFinish={onSave}
      busy={saving}
      error={
        error === null
          ? (notice ?? null)
          : error === "locked"
            ? t.saveLocked!
            : t.saveFailed!
      }
      onExit={leave}
      dirty={dirty}
    />
  )
}

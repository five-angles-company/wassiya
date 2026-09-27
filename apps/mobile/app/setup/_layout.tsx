import { Redirect, Stack, usePathname } from "expo-router"

import { LoadingScreen } from "@/components/loading-screen"
import { useSetupEvidence } from "@/hooks/use-setup-evidence"
import { routeForStep } from "@/lib/setup-routes"
import type { SetupStep } from "@/lib/setup-flow"

/**
 * Which paths each step may legitimately be sitting on.
 *
 * The gate compares *ownership*, not exact paths, because a step spans more
 * than one screen and those screens hand off between themselves faster than
 * the evidence changes:
 *
 *  - `explainer` owns `/setup/kyc` so that the verified card on the waiting
 *    screen survives the moment identity flips to verified. Without it the
 *    layout would bounce the user straight past a screen they are meant to read.
 *  - `recoveryKit` owns `/setup/biometrics` so the key screen can hand off to
 *    the kit after the key exists, and `explainer` owns it so it can be reached
 *    before it does.
 *  - `done` owns `/setup/complete` so 2.6 is not immediately redirected to the
 *    tabs by the very milestone it is reporting.
 */
const OWNED_PATHS: Record<SetupStep, readonly string[]> = {
  welcome: [],
  kyc: ["/setup/kyc"],
  kycPending: ["/setup/kyc"],
  explainer: ["/setup/kyc", "/setup/biometrics"],
  recoveryKit: [
    "/setup/biometrics",
    "/setup/recovery-kit",
    // 2.6 is reached *before* `markPaperPrinted` lands, so the kit step has to
    // own the destination too or the gate bounces the user back mid-hand-off.
    "/setup/complete",
  ],
  recovery: [],
  // Deliberately NOT `/setup/recovery-kit`: a finished run that wandered back
  // there would re-enter the ceremony and rotate the paper version for nothing.
  done: ["/setup/complete"],
}

/**
 * The setup run, gated on evidence rather than on navigation history.
 *
 * Deep-linking or relaunching into a step the user has not reached — or has
 * already finished — is bounced to the step their evidence actually supports.
 * That is what makes the flow linear without trusting the stack: the table in
 * `lib/setup-flow` is the single authority, and it is re-read on every render.
 */
export default function SetupLayout() {
  const { loading, step } = useSetupEvidence()
  const pathname = usePathname()

  if (loading) return <LoadingScreen />

  const owned = OWNED_PATHS[step]
  if (!owned.some((path) => pathname.startsWith(path))) {
    return <Redirect href={routeForStep(step, true)} />
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  )
}

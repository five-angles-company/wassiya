import type { Href } from "expo-router"

import type { SetupStep } from "@/lib/setup-flow"

/**
 * Where each resume step lands.
 *
 * Route segments are literal (`/auth/signup`, `/setup/kyc/pending`) rather than
 * expo-router groups, because the design carries its own URL table and
 * a group — `(setup)` — would strip the segment and yield `/kyc/pending`.
 *
 * `welcome` resolves at the call site: a first-run user gets the carousel, a
 * returning one who has already seen it goes straight to sign-in.
 */
export const SETUP_ROUTE: Record<Exclude<SetupStep, "welcome">, Href> = {
  kyc: "/setup/kyc",
  kycPending: "/setup/kyc/pending",
  explainer: "/setup/explainer",
  recoveryKit: "/setup/recovery-kit",
  recovery: "/recovery",
  done: "/home",
}

export function routeForStep(step: SetupStep, hasSeenWelcome: boolean): Href {
  if (step === "welcome") return hasSeenWelcome ? "/auth/signin" : "/welcome"
  return SETUP_ROUTE[step]
}

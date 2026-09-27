import type { ReactNode } from "react"

/** One screen of an asset's step flow: one question, and what answers it. */
export type FlowStep = {
  key: string
  question: string
  hint?: string
  content: ReactNode
  /** Why the step cannot continue yet — shown on the button — or null. */
  blocked: string | null
  /** Every field on it may stay empty; the question says so. */
  optional?: boolean
  /**
   * Editing this step of a saved asset asks for a fingerprint first. Only the
   * seed phrase: a phrase that leaks *is* the wallet.
   */
  guarded?: boolean
}

/** One card on the asset page, opening the step that edits it. */
export type AssetSection = {
  /** The key of the step the card opens. */
  step: string
  label: string
  value: string
  /** The value describes a secret rather than showing it. */
  secret?: boolean
  /** The value is a placeholder — nothing recorded yet. */
  empty?: boolean
}

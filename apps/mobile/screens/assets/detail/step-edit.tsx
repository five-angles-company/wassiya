/**
 * `/assets/[id]/edit?step=…` — one step of a saved asset. A dispatcher and
 * nothing else: the type decides which editor runs, and that has to happen
 * before either child calls a hook. Exhaustive over `AssetType`, so a new type
 * is a compile error here.
 */
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { useLocalSearchParams } from "expo-router"

import { LoadingScreen } from "@/components/loading-screen"
import { useStrings } from "@/i18n/use-strings"
import { BankStepEdit } from "@/screens/assets/detail/edit/bank"
import { CryptoStepEdit } from "@/screens/assets/detail/edit/crypto"
import { DigitalStepEdit } from "@/screens/assets/detail/edit/digital"
import { DocumentStepEdit } from "@/screens/assets/detail/edit/document"
import { NoteStepEdit } from "@/screens/assets/detail/edit/note"
import { PhotosStepEdit } from "@/screens/assets/detail/edit/photos"
import { SimpleStepEdit } from "@/screens/assets/detail/edit/simple-step-edit"
import {
  EMPTY_INSURANCE,
  isInsuranceValid,
  parseInsurance,
  toInsurancePayload,
} from "@/screens/assets/detail/forms/insurance"
import {
  EMPTY_INVESTMENT,
  isInvestmentValid,
  parseInvestment,
  toInvestmentPayload,
} from "@/screens/assets/detail/forms/investment"
import { useInsuranceSteps } from "@/screens/assets/flow/insurance-steps"
import { useInvestmentSteps } from "@/screens/assets/flow/investment-steps"

export function AssetStepEditScreen() {
  const { id, step } = useLocalSearchParams<{ id: string; step: string }>()
  const assetId = id as Id<"assets">
  const investment = useStrings("assets/new/investment").t
  const insurance = useStrings("assets/new/insurance").t
  const asset = useQuery(api.assets.get, { assetId })

  if (asset === undefined) return <LoadingScreen back="/assets" />

  const props = { assetId, stepKey: step ?? "" }
  switch (asset.type) {
    case "crypto":
      return <CryptoStepEdit {...props} />
    case "bank":
      return <BankStepEdit {...props} />
    case "digital":
      return <DigitalStepEdit {...props} />
    case "document":
      return <DocumentStepEdit {...props} />
    case "photos":
      return <PhotosStepEdit {...props} />
    case "note":
      return <NoteStepEdit {...props} />
    case "investment":
      return (
        <SimpleStepEdit
          {...props}
          type="investment"
          kicker={investment.title!}
          empty={EMPTY_INVESTMENT}
          parse={parseInvestment}
          useSteps={useInvestmentSteps}
          toPayload={(form) => toInvestmentPayload(form, investment)}
          isValid={isInvestmentValid}
        />
      )
    case "insurance":
      return (
        <SimpleStepEdit
          {...props}
          type="insurance"
          kicker={insurance.title!}
          empty={EMPTY_INSURANCE}
          parse={parseInsurance}
          useSteps={useInsuranceSteps}
          toPayload={(form) => toInsurancePayload(form, insurance)}
          isValid={isInsuranceValid}
        />
      )
  }
}

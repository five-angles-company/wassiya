import { useStrings } from "@/i18n/use-strings"
import {
  EMPTY_INVESTMENT,
  isInvestmentValid,
  toInvestmentPayload,
} from "@/screens/assets/detail/forms/investment"
import { useInvestmentSteps } from "@/screens/assets/flow/investment-steps"
import { SimpleCreateScreen } from "@/screens/assets/new/simple-create"

/** Adding an investment. The steps are `investment-steps.tsx`. */
export function NewInvestmentScreen() {
  const { t } = useStrings("assets/new/investment")
  return (
    <SimpleCreateScreen
      type="investment"
      kicker={t.title!}
      empty={EMPTY_INVESTMENT}
      useSteps={useInvestmentSteps}
      toPayload={(form) => toInvestmentPayload(form, t)}
      isValid={isInvestmentValid}
    />
  )
}

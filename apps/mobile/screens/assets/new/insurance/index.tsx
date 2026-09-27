import { useStrings } from "@/i18n/use-strings"
import {
  EMPTY_INSURANCE,
  isInsuranceValid,
  toInsurancePayload,
} from "@/screens/assets/detail/forms/insurance"
import { useInsuranceSteps } from "@/screens/assets/flow/insurance-steps"
import { SimpleCreateScreen } from "@/screens/assets/new/simple-create"

/** Adding an insurance policy. The steps are `insurance-steps.tsx`. */
export function NewInsuranceScreen() {
  const { t } = useStrings("assets/new/insurance")
  return (
    <SimpleCreateScreen
      type="insurance"
      kicker={t.title!}
      empty={EMPTY_INSURANCE}
      useSteps={useInsuranceSteps}
      toPayload={(form) => toInsurancePayload(form, t)}
      isValid={isInsuranceValid}
    />
  )
}

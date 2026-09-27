import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Lock, UserCheck } from "lucide-react-native"
import { View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { ChoiceCards } from "@/screens/assets/flow/choice-cards"
import type { FlowStep } from "@/screens/assets/flow/types"

type Choice = "handedOver" | "private"

/**
 * The last step of every creation flow: handed over, or private. Handed over
 * is preselected — AGENTS.md "Handover" makes it the default for new assets —
 * and the owner sees the choice before anything is saved.
 */
export function useHandoverStep(): { step: FlowStep; handedOver: boolean } {
  const { t } = useStrings("assets/handover")
  const executors = useQuery(api.executors.list)
  const [choice, setChoice] = useState<Choice>("handedOver")

  const noExecutor = executors !== undefined && executors.length === 0

  return {
    handedOver: choice === "handedOver",
    step: {
      key: "handover",
      question: t.question!,
      hint: t.hint,
      blocked: null,
      content: (
        <View className="gap-4">
          <ChoiceCards<Choice>
            options={[
              {
                value: "handedOver",
                title: t.handedOver!,
                detail: t.handedOverBody,
                icon: UserCheck,
              },
              {
                value: "private",
                title: t.private!,
                detail: t.privateBody,
                icon: Lock,
              },
            ]}
            value={choice}
            onChange={setChoice}
          />
          {choice === "handedOver" && noExecutor ? (
            <Text variant="proseSm" className="text-terracotta-800">
              {t.noExecutorCreate}
            </Text>
          ) : null}
        </View>
      ),
    },
  }
}

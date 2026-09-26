import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { Plus } from "lucide-react-native"
import { View } from "react-native"

import { NumberedRow } from "@/components/numbered-row"

/**
 * ٥.١b — no executor yet.
 *
 * An executor is a new idea to most owners, so the empty list teaches it in
 * three steps before asking for a name. The steps carry the two promises that
 * must reach the owner before they choose someone: the sheet opens nothing
 * while they live, and Wassiya tells the executor nothing before release.
 *
 * ⚠️ Mount it in a `gap-header` `Screen`: it returns a fragment.
 */
export type ExecutorsEmptyProps = {
  title: string
  subtitle: string
  lead: string
  steps: { label: string; body: string }[]
  addLabel: string
  onAdd: () => void
  locale: Locale
}

export function ExecutorsEmpty({
  title,
  subtitle,
  lead,
  steps,
  addLabel,
  onAdd,
  locale,
}: ExecutorsEmptyProps) {
  return (
    <>
      <View>
        <Text className="font-heading-extrabold text-foreground mb-1.25 text-[30px] leading-[1.2]">
          {title}
        </Text>
        <Text className="text-[13px] opacity-55">{subtitle}</Text>
      </View>

      <Text className="max-w-85 text-[17px] leading-[1.65]">{lead}</Text>

      <View className="gap-row mb-auto">
        {steps.map((step, index) => (
          <NumberedRow
            key={step.label}
            index={index + 1}
            label={step.label}
            body={step.body}
            locale={locale}
          />
        ))}
      </View>

      <PrimaryCta label={addLabel} onPress={onAdd} icon={Plus} />
    </>
  )
}

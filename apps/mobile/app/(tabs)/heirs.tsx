import { TabPlaceholder } from "@/screens/tabs/placeholder"
import { useStrings } from "@/i18n/use-strings"

export default function Route() {
  const { t } = useStrings("tabs")
  return <TabPlaceholder title={t.heirs} />
}

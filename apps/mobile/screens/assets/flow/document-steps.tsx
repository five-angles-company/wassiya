/**
 * ٤.٥ — a document's first step, shared by creating and editing: what the
 * document is, and what to call it.
 *
 * The file step is not shared. A new document is pages assembled into one PDF
 * at save; a saved one is a stored file that can only be replaced. Each host
 * builds its own.
 */
import { Award, FileText, HeartHandshake, ScrollText } from "lucide-react-native"
import { View } from "react-native"

import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import { describeType } from "@/screens/assets/detail/forms/document"
import { ChoiceCards } from "@/screens/assets/flow/choice-cards"
import type { AssetSection, FlowStep } from "@/screens/assets/flow/types"

export type DocumentAbout = { title: string; kind: string }

export function useDocumentAboutStep(
  value: DocumentAbout,
  patch: (fields: Partial<DocumentAbout>) => void
): FlowStep {
  const { t } = useStrings("assets/new/document")

  return {
    key: "about",
    question: t.qAbout!,
    blocked: value.title.trim().length === 0 ? t.needsTitle! : null,
    content: (
      <View className="gap-5">
        <ChoiceCards
          options={[
            { value: "deed", title: t.typeDeed!, icon: ScrollText },
            { value: "marriage", title: t.typeMarriage!, icon: HeartHandshake },
            { value: "certificate", title: t.typeCertificate!, icon: Award },
            { value: "other", title: t.typeOther!, icon: FileText },
          ]}
          value={value.kind === "" ? null : value.kind}
          onChange={(kind) => patch({ kind })}
        />
        <Field
          label={t.titleLabel!}
          placeholder={t.titlePlaceholder}
          value={value.title}
          onChangeText={(title) => patch({ title })}
        />
      </View>
    ),
  }
}

export function documentSections(
  form: DocumentAbout & { current: { byteSize: number; mimeType: string } },
  t: Record<string, string>,
  formatSize: (bytes: number) => string
): AssetSection[] {
  const kind =
    {
      deed: t.typeDeed,
      marriage: t.typeMarriage,
      certificate: t.typeCertificate,
      other: t.typeOther,
    }[form.kind] ?? ""
  return [
    {
      step: "about",
      label: t.sectionAbout!,
      value: kind.length > 0 ? `${kind} · ${form.title.trim()}` : form.title.trim(),
    },
    {
      step: "file",
      label: t.fileLabel!,
      value: `${describeType(form.current.mimeType)} · ${formatSize(form.current.byteSize)}`,
    },
  ]
}

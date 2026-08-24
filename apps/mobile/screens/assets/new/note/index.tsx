/**
 * ٤.٨ — a note. The board's own subtitle is "a letter, not a text field".
 *
 * What survives from that redesign here: the three kind pills that set the
 * note's job and drive its placeholder, the raised page it is written on, and
 * the word count and "تُقرأ عند الإفراج" line that make clear who this is for.
 *
 * What does **not**: the rich-text toolbar (bold / italic / list / the sage
 * wish block), voice dictation, the overlapped-avatar recipient strip and the
 * linked-asset chip. Bold and italic need a rich-text editor and a storage
 * format to match; dictation needs on-device speech recognition; the recipient
 * strip needs section ٥. Shipping a toolbar whose buttons do nothing would be
 * worse than a plain page that saves what you wrote — so this is a plain page
 * that saves what you wrote, and the letter's *shape* is what carries the
 * intent until the rest lands.
 */
import { useState } from "react"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { TextInput, View } from "react-native"

import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

/** `--color-muted-foreground`; RN takes placeholder colour as a prop. */
const MUTED_FOREGROUND = "#82796a"

type NoteKind = "instructions" | "whereabouts" | "wish"

export function NewNoteScreen() {
  const { t, locale } = useStrings("assets/new/note")
  const { t: chrome } = useStrings("assets/new")
  const { submit, submitting, error } = useAssetSubmit()

  const [kind, setKind] = useState<NoteKind>("instructions")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  // Whitespace-separated runs. Arabic has no different rule here, and the
  // board's own "١٤٢ كلمة" is this same count.
  const words = body.trim().length === 0 ? 0 : body.trim().split(/\s+/u).length

  async function save() {
    const saved = await submit({
      type: "note",
      label: {
        title: title.trim(),
        subtitle: `${KIND_LABEL(t)[kind]} · ${t.words.replace("{n}", fmtNum(words, locale))}`,
      },
      // The kind travels inside the ciphertext: it decides where the note sits
      // in the heir's release bundle, and that is not the server's business.
      secret: JSON.stringify({ kind, title: title.trim(), body }),
      meta: { itemCount: words },
    })
    if (saved) router.back()
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={title.trim().length > 0 && body.trim().length > 0}
      submitting={submitting}
      onSubmit={() => void save()}
    >
      <View className="gap-4">
        <OptionChips
          options={[
            { value: "instructions", label: t.kindInstructions },
            { value: "whereabouts", label: t.kindWhereabouts },
            { value: "wish", label: t.kindWish },
          ]}
          value={kind}
          onChange={(value) => setKind(value as NoteKind)}
        />

        <Field
          label={t.titleLabel}
          placeholder={t.titlePlaceholder}
          value={title}
          onChangeText={setTitle}
        />

        {/* The page. `neutral-100` raised on the sand ground, generous leading,
            and no visible field border — the board's "letter on paper" reading
            comes from the surface, not from a toolbar. */}
        <View className="rounded-card bg-neutral-100 p-4">
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={PLACEHOLDER(t)[kind]}
            placeholderTextColor={MUTED_FOREGROUND}
            multiline
            textAlignVertical="top"
            className="min-h-52 text-[16px] leading-[1.9] text-foreground"
          />
          <View className="mt-3 flex-row items-center justify-between">
            <Text variant="metaSm" className="text-muted-foreground">
              {t.words.replace("{n}", fmtNum(words, locale))}
            </Text>
            <Text variant="metaSm" className="text-muted-foreground">
              {t.readOnRelease}
            </Text>
          </View>
        </View>

        <Text variant="metaSm" className="text-muted-foreground leading-[1.7]">
          {chrome.encryptNote}
        </Text>

        {error !== null ? (
          <Text variant="meta" className="text-terracotta-800">
            {error}
          </Text>
        ) : null}
      </View>
    </WizardFrame>
  )
}

/** The pills' whole purpose: each kind opens with a different prompt. */
const PLACEHOLDER = (t: Record<string, string>) =>
  ({
    instructions: t.bodyInstructions!,
    whereabouts: t.bodyWhereabouts!,
    wish: t.bodyWish!,
  }) satisfies Record<NoteKind, string>

const KIND_LABEL = (t: Record<string, string>) =>
  ({
    instructions: t.kindInstructions!,
    whereabouts: t.kindWhereabouts!,
    wish: t.kindWish!,
  }) satisfies Record<NoteKind, string>

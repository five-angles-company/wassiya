/**
 * ٤.٥ — adding a document: what it is, then its pages. The pages, their
 * assembly into one PDF and the cleanup of plaintext scans are
 * `use-document-pages.tsx`.
 */
import { useState } from "react"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"

import { useStrings } from "@/i18n/use-strings"
import {
  stripExtension,
  toDocumentPayload,
} from "@/screens/assets/detail/forms/document"
import {
  useDocumentAboutStep,
  type DocumentAbout,
} from "@/screens/assets/flow/document-steps"
import { StepFlow } from "@/screens/assets/flow/step-flow"
import { useDocumentPages } from "@/screens/assets/flow/use-document-pages"
import { useHandoverStep } from "@/screens/assets/flow/use-handover-step"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

export function NewDocumentScreen() {
  const { t, locale } = useStrings("assets/new/document")
  const { t: chrome } = useStrings("assets/new")
  const { submit, submitting, error } = useAssetSubmit()

  const [about, setAbout] = useState<DocumentAbout>({ title: "", kind: "" })
  const pages = useDocumentPages({
    // The file's own name, but never over a title that already exists.
    onPickedName: (name) =>
      setAbout((current) =>
        current.title.trim().length > 0 ? current : { ...current, title: stripExtension(name) }
      ),
  })
  const aboutStep = useDocumentAboutStep(about, (fields) =>
    setAbout((current) => ({ ...current, ...fields }))
  )
  const handover = useHandoverStep()

  const formatSize = (bytes: number) =>
    `${fmtNum(Math.round((bytes / 1024 / 1024) * 10) / 10, locale)} ${locale === "ar" ? "م.ب" : "MB"}`

  async function save() {
    if (!pages.has || about.title.trim().length === 0) return
    const file = await pages.assemble()
    if (file === null) return

    const payload = toDocumentPayload(
      {
        ...about,
        replacement: null,
        current: { byteSize: file.size, mimeType: file.mimeType },
      },
      formatSize
    )
    const saved = await submit({
      type: "document",
      label: payload.label,
      secret: payload.secret,
      meta: payload.meta,
      files: [{ uri: file.uri, byteSize: file.size }],
      handOver: handover.handedOver,
    })
    if (saved !== null) {
      pages.release()
      router.replace({ pathname: "/assets/[id]", params: { id: saved } })
    }
  }

  return (
    <StepFlow
      kicker={t.title!}
      steps={[
        aboutStep,
        {
          key: "file",
          question: t.qFile!,
          hint: t.hFile,
          blocked: pages.has ? null : t.needsFile!,
          content: pages.content,
        },
        handover.step,
      ]}
      finishLabel={chrome.saveAsset!}
      onFinish={() => void save()}
      busy={submitting || pages.assembling}
      error={error}
      onExit={() => (router.canGoBack() ? router.back() : router.replace("/assets"))}
      dirty={about.title.trim().length > 0 || about.kind !== "" || pages.has}
    />
  )
}

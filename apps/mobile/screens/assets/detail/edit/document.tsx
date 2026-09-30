/**
 * One step of a saved document. The file step opens the stored file on request
 * (`use-stored-files.ts`) and replaces it (`use-document-replacement.tsx`).
 */
import type { Id } from "@workspace/backend/dataModel"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"

import { useStrings } from "@/i18n/use-strings"
import {
  describeType,
  isDocumentValid,
  parseDocument,
  stripExtension,
  toDocumentPayload,
  type DocumentForm,
} from "@/screens/assets/detail/forms/document"
import { StepEditFrame } from "@/screens/assets/detail/step-edit-frame"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"
import { useStoredFiles } from "@/screens/assets/detail/use-stored-files"
import { useDocumentAboutStep } from "@/screens/assets/flow/document-steps"
import { useDocumentReplacement } from "@/screens/assets/flow/use-document-replacement"

const EMPTY_DOCUMENT: DocumentForm = {
  title: "",
  kind: "",
  replacement: null,
  current: { byteSize: 0, mimeType: "application/octet-stream" },
}

export function DocumentStepEdit({ assetId, stepKey }: { assetId: Id<"assets">; stepKey: string }) {
  const { t, locale } = useStrings("assets/new/document")
  const { asset, load, save, saving, error, noteReveal } = useAssetEditor(assetId)
  const { form, patch, dirty } = useEditForm(load.status === "ready" ? load : null, parseDocument)
  const value = form ?? EMPTY_DOCUMENT
  const { t: detail } = useStrings("assets/detail")
  const stored = useStoredFiles(asset?.dekWrappedByMk)
  const storedFile = load.status === "ready" ? load.files[0] : undefined

  const formatSize = (bytes: number) =>
    `${fmtNum(Math.round((bytes / 1024 / 1024) * 10) / 10, locale)} ${locale === "ar" ? "م.ب" : "MB"}`

  const about = useDocumentAboutStep(value, patch)
  const replacement = useDocumentReplacement({
    replacement: value.replacement,
    current: `${describeType(value.current.mimeType)} · ${formatSize(value.current.byteSize)}`,
    onReplace: (file) =>
      patch({
        replacement: file,
        // The file's own name, but never over a title that already exists.
        ...(value.title.trim().length === 0 ? { title: stripExtension(file.name) } : null),
      }),
    onOpen:
      storedFile === undefined
        ? undefined
        : () => void stored.share(storedFile, value.current.mimeType),
    opening: stored.busy !== null,
  })

  async function onSave() {
    if (form === null || !isDocumentValid(form)) return
    const file = form.replacement
    const ok = await save({
      ...toDocumentPayload(form, formatSize),
      // Absent keeps the stored file; a replacement supersedes it.
      files: file === null ? undefined : [{ uri: file.uri, byteSize: file.size }],
    })
    if (ok) {
      replacement.release()
      router.back()
    }
  }

  return (
    <StepEditFrame
      load={load}
      readable={form !== null}
      step={[
        about,
        {
          key: "file",
          question: t.qFile!,
          hint: t.hFile,
          blocked: null,
          content: replacement.content,
        },
      ].find((step) => step.key === stepKey)}
      kicker={t.title!}
      onSave={() => void onSave()}
      saving={saving}
      error={error}
      dirty={dirty}
      onReveal={noteReveal}
      notice={stored.failed ? detail.openFailed : undefined}
    />
  )
}

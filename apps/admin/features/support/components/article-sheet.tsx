"use client"

import { useState, type ReactNode } from "react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { ConfirmAction } from "@/components/confirm-action"
import { useLocale } from "@/components/locale-provider"
import { SheetShell } from "@/components/sheet-shell"
import { usePermissions } from "@/hooks/use-permissions"
import type { Article } from "@/features/support/components/help-articles"
import {
  AUDIENCES,
  audienceLabel,
  errorMessage,
  type Audience,
} from "@/features/support/lib/labels"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"

export function ArticleSheet({
  article,
  nextOrder,
  onClose,
}: {
  article: Article | "new" | null
  nextOrder: number
  onClose: () => void
}) {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const { has } = usePermissions()
  const canEdit = has("support.manage")
  const save = useMutation(api.support.help.adminSaveArticle)
  const remove = useMutation(api.support.help.adminDeleteArticle)

  const existing = article !== null && article !== "new" ? article : null
  const [slug, setSlug] = useState(existing?.slug ?? "")
  const [audience, setAudience] = useState<Audience>(existing?.audience ?? "all")
  const [order, setOrder] = useState(String(existing?.order ?? nextOrder))
  const [published, setPublished] = useState(existing?.published ?? true)
  const [title, setTitle] = useState(existing?.title ?? { ar: "", en: "" })
  const [body, setBody] = useState(existing?.body ?? { ar: "", en: "" })
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await save({
        id: existing?.id,
        slug,
        audience,
        order: Number(order) || 0,
        published,
        title,
        body,
      })
      toast.success(labels.saved)
      onClose()
    } catch (error) {
      toast.error(errorMessage(error, locale))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SheetShell
      open={article !== null}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={existing === null ? labels.newArticle : labels.editArticle}
      description={labels.articleRule}
      footer={
        canEdit ? (
          <>
            {existing !== null && (
              <ConfirmAction
                tone="destructive"
                title={labels.deleteTitle}
                body={labels.deleteBody}
                confirmLabel={labels.delete}
                cancelLabel={labels.cancel}
                onConfirm={async () => {
                  await remove({ id: existing.id })
                  onClose()
                }}
                trigger={
                  <Button variant="ghost" className="me-auto text-destructive">
                    {labels.delete}
                  </Button>
                }
              />
            )}
            <Button onClick={submit} disabled={busy}>
              {labels.save}
            </Button>
          </>
        ) : undefined
      }
    >
      <fieldset disabled={!canEdit} className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-[1fr_140px_90px] gap-3">
          <Field label={labels.slug}>
            <Input dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Field label={labels.audience}>
            <Select
              value={audience}
              onValueChange={(value) => setAudience(value as Audience)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {audienceLabel(key, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={labels.order}>
            <Input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={published}
            onCheckedChange={(value) => setPublished(value === true)}
          />
          {labels.published}
        </label>
        <Field label={labels.titleAr}>
          <Input
            dir="rtl"
            value={title.ar}
            onChange={(e) => setTitle({ ...title, ar: e.target.value })}
          />
        </Field>
        <Field label={labels.bodyAr}>
          <Textarea
            dir="rtl"
            value={body.ar}
            onChange={(e) => setBody({ ...body, ar: e.target.value })}
            className="min-h-32"
          />
        </Field>
        <Field label={labels.titleEn}>
          <Input
            dir="ltr"
            value={title.en}
            onChange={(e) => setTitle({ ...title, en: e.target.value })}
          />
        </Field>
        <Field label={labels.bodyEn}>
          <Textarea
            dir="ltr"
            value={body.en}
            onChange={(e) => setBody({ ...body, en: e.target.value })}
            className="min-h-32"
          />
        </Field>
      </fieldset>
    </SheetShell>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

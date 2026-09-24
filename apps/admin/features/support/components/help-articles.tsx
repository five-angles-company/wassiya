"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import type { FunctionReturnType } from "convex/server"
import { useQuery } from "convex/react"
import { PlusIcon } from "lucide-react"

import { IfPermitted } from "@/components/permission-gate"
import { useLocale } from "@/components/locale-provider"
import { ArticleSheet } from "@/features/support/components/article-sheet"
import { audienceLabel } from "@/features/support/lib/labels"
import { SUPPORT } from "@/features/support/strings/support"
import { t } from "@/lib/i18n/locale"

export type Article = FunctionReturnType<
  typeof api.support.help.adminArticles
>[number]

export function HelpArticles() {
  const locale = useLocale()
  const labels = t(SUPPORT, locale)
  const articles = useQuery(api.support.help.adminArticles)
  const [editing, setEditing] = useState<Article | "new" | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          {labels.articleRule}
        </p>
        <IfPermitted need="support.manage">
          <Button className="ms-auto" onClick={() => setEditing("new")}>
            <PlusIcon />
            {labels.newArticle}
          </Button>
        </IfPermitted>
      </div>

      {articles === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : articles.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {labels.noArticles}
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {articles.map((article) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => setEditing(article)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-muted/60"
              >
                <span className="w-8 text-xs text-muted-foreground tabular-nums">
                  {article.order}
                </span>
                <span className="flex-1 truncate font-medium">
                  {article.title[locale]}
                </span>
                <Badge variant="outline">
                  {audienceLabel(article.audience, locale)}
                </Badge>
                <Badge variant={article.published ? "secondary" : "outline"}>
                  {article.published ? labels.published : labels.draft}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ArticleSheet
        key={editing === null ? "closed" : editing === "new" ? "new" : editing.id}
        article={editing}
        nextOrder={((articles ?? []).at(-1)?.order ?? 0) + 10}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}

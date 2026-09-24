import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

// `/legal/{terms,privacy,encryption}` are linked from the mobile app
// (`apps/mobile/screens/settings/legal`), so a file here must never be renamed
// without changing that screen in the same commit.
const legal = defineCollection({
  loader: glob({ pattern: "{ar,en}/*.md", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date(),
    /** Renders the "pending legal review" banner. Only a lawyer's sign-off removes it. */
    draft: z.boolean().default(false),
  }),
})

export const collections = { legal }

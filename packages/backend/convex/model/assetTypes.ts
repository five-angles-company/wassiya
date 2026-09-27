// Every value `assets.type` can hold — the schema, the asset functions and the
// console all read this one list. Adding a type also needs the owner's app
// (`apps/mobile/lib/asset-types.ts`) and the executor's view
// (`apps/web/features/handover/components/asset-row.tsx`) to know it, or a
// handed-over asset of that type opens with no name and no labels.
import { v } from "convex/values"

export const ASSET_TYPES = [
  "crypto",
  "bank",
  "document",
  "photos",
  "digital",
  "note",
  "investment",
  "insurance",
] as const

export type AssetType = (typeof ASSET_TYPES)[number]

export const assetTypeValidator = v.union(
  ...ASSET_TYPES.map((type) => v.literal(type))
)

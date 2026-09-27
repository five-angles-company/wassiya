/**
 * The kinds of thing a vault holds, and the glyph each one wears, in picker
 * order. Mirrors `packages/backend/convex/model/assetTypes.ts`; a type missing
 * from either side opens with no name.
 *
 * Only what the family would lose without knowing it existed: secrets, and
 * money and papers nobody else can find. Property and vehicles are in public
 * registries; where things are, and who to call, is a note.
 *
 * `bank` is a `Landmark` and `digital` an `AtSign` on purpose: the obvious
 * stand-ins would be misread at 18px.
 */
import {
  AtSign,
  Bitcoin,
  File,
  Image as ImageIcon,
  Landmark,
  Pencil,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react-native"
import type { Tone } from "@workspace/ui-native/lib/tone"

export const ASSET_TYPES = [
  "crypto",
  "bank",
  "investment",
  "insurance",
  "digital",
  "document",
  "photos",
  "note",
] as const

export type AssetType = (typeof ASSET_TYPES)[number]

export const ASSET_TYPE_ICON: Record<AssetType, LucideIcon> = {
  crypto: Bitcoin,
  bank: Landmark,
  investment: TrendingUp,
  insurance: ShieldCheck,
  digital: AtSign,
  document: File,
  photos: ImageIcon,
  // A pencil, not a sticky note: a note here is written to be read after you
  // are gone.
  note: Pencil,
}

/**
 * Icon tint on the picker tiles, grouping types by **what they hold** —
 * secrets terracotta, files olive, directions sand. A grouping, not a
 * severity: terracotta here means "contains a secret", the opposite of what it
 * means on a status line.
 */
export const ASSET_TYPE_TONE: Record<AssetType, Tone> = {
  crypto: "terracotta",
  digital: "terracotta",
  investment: "terracotta",
  document: "olive",
  photos: "olive",
  bank: "sand",
  insurance: "sand",
  note: "sand",
}

/**
 * Where each tile goes. `digital` maps to `/assets/new/account` — the route is
 * named after what the owner describes, the schema after what it is.
 */
export const ASSET_TYPE_ROUTE = {
  crypto: "/assets/new/crypto",
  bank: "/assets/new/bank",
  investment: "/assets/new/investment",
  insurance: "/assets/new/insurance",
  digital: "/assets/new/account",
  document: "/assets/new/document",
  photos: "/assets/new/photos",
  note: "/assets/new/note",
} as const satisfies Record<AssetType, string>

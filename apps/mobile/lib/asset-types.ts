/**
 * The six kinds of thing a vault holds, and the glyph each one wears. The order
 * is the board's own, from the ٤.٢ picker, and is also the ٤.١ filter-chip order.
 *
 * The board draws its own outline glyphs rather than naming lucide icons, so
 * these are the closest equivalents, collected here for one edit rather than
 * inlined per call site. Two depart from the drawn shape on purpose: `bank` is a
 * `Landmark` and `digital` an `AtSign`, because the drawn stand-ins would be
 * misread at 18px — a house next to "مصرف الراجحي" reads as property, not
 * banking.
 */
import {
  AtSign,
  Bitcoin,
  File,
  Image as ImageIcon,
  Landmark,
  Pencil,
  type LucideIcon,
} from "lucide-react-native"
import type { Tone } from "@workspace/ui-native/lib/tone"

/** Mirrors the `assetType` union in `convex/assets.ts`, in board order. */
export const ASSET_TYPES = [
  "crypto",
  "bank",
  "document",
  "photos",
  "digital",
  "note",
] as const

export type AssetType = (typeof ASSET_TYPES)[number]

export const ASSET_TYPE_ICON: Record<AssetType, LucideIcon> = {
  crypto: Bitcoin,
  // The board draws a gabled building. `Landmark` is lucide's bank — the same
  // pediment, with columns — where `House` would read as real estate.
  bank: Landmark,
  // A plain page with a folded corner, not `FileText`: the board's glyph has no
  // rules on it, and a document here is as often a scan as it is text.
  document: File,
  photos: ImageIcon,
  digital: AtSign,
  // A pencil, not a sticky note. A note in this vault is something written to
  // be read after you are gone; a memo pad is the wrong object entirely.
  note: Pencil,
}

/**
 * Icon tint on the 4.2 tiles, grouping the six types by **what they hold** —
 * the board's own rule: "secrets (terracotta), files (sage), instructions
 * (neutral)".
 *
 * It is a grouping, not a severity: `terracotta` here means "this one contains
 * a secret", not "this one needs attention". That is the opposite of what the
 * same colour means on a `StatusPill`, which is why the mapping is named and
 * lives beside the type list instead of being written inline per tile.
 */
export const ASSET_TYPE_TONE: Record<AssetType, Tone> = {
  // Seed phrases and passwords.
  crypto: "terracotta",
  digital: "terracotta",
  // Encrypted blobs.
  document: "olive",
  photos: "olive",
  // An IBAN and a wish are both directions to follow, not secrets to guard.
  bank: "sand",
  note: "sand",
}

/**
 * Where each tile on ٤.٢ goes.
 *
 * `digital` maps to `/assets/new/account`, not `/assets/new/digital` — the
 * board names that route after what the user is describing (an account), while
 * the schema names the column after the kind of thing it is. Both stay as they
 * are; this table is where the two vocabularies meet, so neither has to bend.
 */
export const ASSET_TYPE_ROUTE = {
  crypto: "/assets/new/crypto",
  bank: "/assets/new/bank",
  document: "/assets/new/document",
  photos: "/assets/new/photos",
  digital: "/assets/new/account",
  note: "/assets/new/note",
} as const satisfies Record<AssetType, string>

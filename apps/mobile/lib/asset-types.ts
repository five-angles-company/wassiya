/**
 * The six kinds of thing a vault holds, and the glyph each one wears.
 *
 * The order is the board's own, from the 4.2 picker — it is also the order the
 * 4.1 filter chips appear in, so both read the same way round.
 *
 * ## About the icons
 *
 * The board draws its own outline glyphs rather than naming lucide icons, so
 * these are the closest lucide equivalents and are collected here — one table,
 * one edit — rather than being inlined at each call site. Two are deliberate
 * departures from the drawn shape: `bank` is a `Landmark` where the board draws
 * a house outline, and `digital` is an `AtSign` where it draws a bare rounded
 * rectangle. Both were chosen because the drawn glyph is a stand-in that would
 * be misread at 18px in a real list — a house next to "مصرف الراجحي" reads as
 * property, not banking.
 */
import {
  AtSign,
  Bitcoin,
  FileText,
  Image as ImageIcon,
  Landmark,
  StickyNote,
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
  bank: Landmark,
  document: FileText,
  photos: ImageIcon,
  digital: AtSign,
  note: StickyNote,
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

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

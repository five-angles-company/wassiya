import Image from "next/image"

import { cn } from "@workspace/ui/lib/utils"

/**
 * The brand's ribbon "w".
 *
 * The same `brand/mark.png` `apps/web` draws, itself cut from `logo-mark.png`
 * in the mobile app's brand sources — the three surfaces share one file so they
 * cannot drift. The **wordmark is deliberately not used**: it sets "wassiya" in
 * Latin, and the name beside the mark here is localised text.
 *
 * It fills the width of whatever box the caller gives it rather than carrying a
 * height of its own. The sidebar's lockup collapses to a 32px square under
 * `overflow-hidden`, and a 2:1 ribbon with a fixed height is clipped there
 * instead of scaling.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/mark.png"
      alt=""
      aria-hidden
      width={52}
      height={26}
      priority
      className={cn("h-auto w-full", className)}
    />
  )
}

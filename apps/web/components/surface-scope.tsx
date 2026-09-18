"use client"

import { usePathname } from "next/navigation"

import { surfaceFor } from "@/lib/surface"

/**
 * Stamps the current world onto the shell, so the bar and the page under it
 * always agree about which one the reader is in.
 *
 * It wraps the header as well as the content, which is the whole reason it
 * exists: the nav is rendered by `(app)/layout.tsx`, above the `(heir)` and
 * `(guardian)` route groups, so it can never inherit an attribute one of those
 * layouts sets. One element above both is the only place that covers both.
 *
 * A client component for `usePathname()`, and the attribute is in the first
 * byte of HTML rather than applied by an effect — a bar that changed colour a
 * frame after the page arrived would read as a glitch. The children are still
 * Server Components; they pass through untouched.
 *
 * `display: contents` so this adds no box at all: the header stays `sticky`
 * against the viewport and `main` keeps its own spacing. Custom properties
 * inherit down the DOM tree regardless of whether an element generates a box.
 */
export function SurfaceScope({ children }: { children: React.ReactNode }) {
  const surface = surfaceFor(usePathname())

  return (
    <div className="contents" data-surface={surface ?? undefined}>
      {children}
    </div>
  )
}

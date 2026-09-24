/**
 * The page's top ground: dot grid and grain, fading into the plain
 * background. Static on purpose — this sits behind the grief flows.
 *
 * ⚠️ The overflow clip lives on this element, never on an ancestor of the
 * header: an `overflow-hidden` ancestor silently breaks `position: sticky`.
 */
export function PageGround() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] overflow-hidden">
      <div className="absolute inset-0">
        <div className="dot-grid grain size-full" />
      </div>
      <div className="to-background absolute inset-x-0 bottom-0 h-56 bg-linear-to-b from-transparent" />
    </div>
  )
}

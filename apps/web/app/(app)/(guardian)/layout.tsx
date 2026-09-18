/**
 * The guardian's world: the invitation, the key, and the two duties.
 *
 * Olive, because olive already means settled and safe in this product and a
 * guardian is never being asked to act urgently — the invitation copy makes the
 * same argument in words, and terracotta would make it read as an alarm. The
 * `[data-surface="guardian"]` block in `globals.css` is what remaps the tone;
 * the shell above is tinted separately by `SurfaceScope`, which reads the same
 * map in `lib/surface.ts`. **Move a route between these groups and that map has
 * to move with it.**
 *
 * The tone reaches chrome only. Asks and CTAs keep reading from `--primary`,
 * because "this needs you" must mean the same thing in both worlds — a guardian
 * with a death to confirm is looking at the same terracotta an heir would be.
 *
 * `contents` so no box is generated: the pages stay direct children of `main`
 * and keep its spacing, and custom properties inherit regardless.
 */
export default function GuardianLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="contents" data-surface="guardian">
      {children}
    </div>
  )
}

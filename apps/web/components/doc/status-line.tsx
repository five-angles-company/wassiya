/**
 * Where things stand, as one line of coloured text.
 *
 * `settled` is olive and means the process is running correctly with nothing
 * owed. `attention` is terracotta and means something is asked of the reader,
 * or the report has ended. There is no third tone and no red anywhere.
 *
 * ⚠️ **The ink steps, not the brand steps.** The brand orange is #ea5b48, which
 * is 2.7:1 on the sand ground — a fill colour, not a reading colour. 700 is
 * 5.4:1. The same holds for olive: `--secondary` is 3.1:1, `olive-700` is 5.4.
 */
export function StatusLine({
  tone,
  children,
}: {
  tone: "settled" | "attention"
  children: React.ReactNode
}) {
  return (
    <p
      className={`text-[15px] leading-[1.6] font-semibold ${
        tone === "settled" ? "text-tone-settled" : "text-tone-attention"
      }`}
    >
      {children}
    </p>
  )
}

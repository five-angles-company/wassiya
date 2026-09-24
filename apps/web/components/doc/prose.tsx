/** Running text. 66ch is the app's one reading measure. */
export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[66ch] space-y-3.5 text-[16px] leading-[1.9]">{children}</div>
}
